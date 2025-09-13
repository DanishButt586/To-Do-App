const { promises: fs } = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'tasks.json');
const BACKUP_FILE = path.join(__dirname, 'tasks.backup.json');

// Robust async mutex for file operations
class AsyncMutex {
    constructor() {
        this.isLocked = false;
        this.queue = [];
    }

    async acquire() {
        return new Promise((resolve) => {
            if (!this.isLocked) {
                this.isLocked = true;
                resolve();
            } else {
                this.queue.push(resolve);
            }
        });
    }

    release() {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
        } else {
            this.isLocked = false;
        }
    }
}

const fileMutex = new AsyncMutex();

async function withFileLock(operation) {
    await fileMutex.acquire();
    try {
        return await operation();
    } finally {
        fileMutex.release();
    }
}

async function createBackup() {
    try {
        const exists = await fs.access(DATA_FILE).then(() => true).catch(() => false);
        if (exists) {
            const raw = await fs.readFile(DATA_FILE, 'utf8');
            if (raw && raw.trim() !== '') {
                // Only backup if file has content and is valid JSON
                JSON.parse(raw);
                await fs.copyFile(DATA_FILE, BACKUP_FILE);
                console.log('Backup created successfully');
            }
        }
    } catch (error) {
        console.log('Backup creation failed:', error.message);
    }
}

async function restoreFromBackup() {
    try {
        const backupExists = await fs.access(BACKUP_FILE).then(() => true).catch(() => false);
        if (backupExists) {
            const backupContent = await fs.readFile(BACKUP_FILE, 'utf8');
            if (backupContent && backupContent.trim() !== '') {
                // Validate backup content
                const data = JSON.parse(backupContent);
                if (data.tasks && Array.isArray(data.tasks)) {
                    await fs.copyFile(BACKUP_FILE, DATA_FILE);
                    console.log('Restored from backup successfully');
                    return true;
                }
            }
        }
    } catch (error) {
        console.log('Backup restore failed:', error.message);
    }
    return false;
}

async function ensureFile() {
    try {
        await fs.access(DATA_FILE);
        // File exists, check if it's valid JSON
        const raw = await fs.readFile(DATA_FILE, 'utf8');
        if (!raw || raw.trim() === '') {
            throw new Error('Empty file');
        }
        const data = JSON.parse(raw); // Test if valid JSON
        if (!data.tasks || !Array.isArray(data.tasks)) {
            throw new Error('Invalid data structure');
        }
    } catch (error) {
        console.log('Creating/fixing tasks file:', error.message);
        const defaultData = { tasks: [] };
        // Make sure directory exists
        const dir = path.dirname(DATA_FILE);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
        console.log('Tasks file created/fixed successfully');
    }
}

async function _loadInternal() {
    await ensureFile();

    // Retry logic for reading file
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const raw = await fs.readFile(DATA_FILE, 'utf8');

            // Check for empty or whitespace-only content
            if (!raw || raw.trim() === '') {
                console.log(`Empty tasks file detected on attempt ${attempt + 1}`);

                if (attempt < 2) {
                    // Try to restore from backup first
                    const restored = await restoreFromBackup();
                    if (restored) {
                        continue; // Retry reading the restored file
                    } else {
                        // Wait a bit and retry
                        await new Promise(resolve => setTimeout(resolve, 50));
                        continue;
                    }
                } else {
                    // Last attempt - initialize with empty array
                    console.log('Final attempt: Initializing with empty array');
                    const defaultData = { tasks: [] };
                    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
                    return [];
                }
            }

            // Try to parse the JSON
            let data;
            try {
                data = JSON.parse(raw);
            } catch (parseError) {
                console.log(`JSON parse error on attempt ${attempt + 1}:`, parseError.message);

                if (attempt < 2) {
                    // Try backup restore
                    const restored = await restoreFromBackup();
                    if (restored) {
                        continue; // Retry with restored file
                    } else {
                        // Wait and retry
                        await new Promise(resolve => setTimeout(resolve, 50));
                        continue;
                    }
                } else {
                    // Last attempt failed - create fresh file
                    console.log('Final attempt: Creating fresh file due to parse error');
                    const defaultData = { tasks: [] };
                    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
                    return [];
                }
            }

            // Validate data structure
            if (!data || !data.tasks || !Array.isArray(data.tasks)) {
                console.log(`Invalid data structure on attempt ${attempt + 1}`);

                if (attempt < 2) {
                    const restored = await restoreFromBackup();
                    if (restored) {
                        continue;
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        continue;
                    }
                } else {
                    console.log('Final attempt: Resetting to empty array');
                    const defaultData = { tasks: [] };
                    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
                    return [];
                }
            }

            // Success!
            return data.tasks;

        } catch (error) {
            console.error(`Error loading tasks on attempt ${attempt + 1}:`, error.message);

            if (attempt < 2) {
                // Try backup restore
                const restored = await restoreFromBackup();
                if (restored) {
                    continue;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    continue;
                }
            } else {
                // Final attempt failed
                console.log('All attempts failed: Creating fresh empty file');
                const defaultData = { tasks: [] };
                await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
                return [];
            }
        }
    }

    // Fallback (should never reach here)
    return [];
}

async function load() {
    return withFileLock(async () => {
        return await _loadInternal();
    });
}

async function _saveInternal(tasks) {
    // Retry logic for saving
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            // Create backup before saving
            await createBackup();

            const dataToSave = JSON.stringify({ tasks }, null, 2);

            // Validate JSON before writing
            JSON.parse(dataToSave); // This will throw if invalid

            // Use atomic write by writing to temp file first
            const tempFile = DATA_FILE + '.tmp';

            // Write to temp file
            await fs.writeFile(tempFile, dataToSave, 'utf8');

            // Verify temp file was written correctly
            const tempContent = await fs.readFile(tempFile, 'utf8');
            const verifyData = JSON.parse(tempContent); // Validate temp file

            if (!verifyData.tasks || !Array.isArray(verifyData.tasks)) {
                throw new Error('Temp file validation failed');
            }

            // On Windows, we might need to delete the target file first
            try {
                await fs.access(DATA_FILE);
                await fs.unlink(DATA_FILE);
                // Small delay to ensure file is released
                await new Promise(resolve => setTimeout(resolve, 10));
            } catch (accessError) {
                // File doesn't exist, which is fine
            }

            // Atomic rename
            await fs.rename(tempFile, DATA_FILE);

            // Verify the final file
            const finalContent = await fs.readFile(DATA_FILE, 'utf8');
            JSON.parse(finalContent); // Final validation

            console.log('Tasks saved successfully');
            return; // Success - exit retry loop

        } catch (error) {
            console.error(`Error saving tasks on attempt ${attempt + 1}:`, error.message);

            // Clean up temp file if it exists
            try {
                await fs.unlink(DATA_FILE + '.tmp');
            } catch { }

            if (attempt < 2) {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            } else {
                // Final attempt failed
                console.error('All save attempts failed:', error);
                throw error;
            }
        }
    }
}

async function save(tasks) {
    return withFileLock(async () => {
        return await _saveInternal(tasks);
    });
}

function nextId(tasks) {
    return tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
}

async function getAll() {
    return load();
}

async function create(task) {
    return withFileLock(async () => {
        const tasks = await _loadInternal();
        const newTask = {
            id: nextId(tasks),
            title: task.title?.trim() || 'Untitled Task',
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(newTask);
        await _saveInternal(tasks);
        return newTask;
    });
}

async function update(id, updates) {
    return withFileLock(async () => {
        console.log('todoStore.update called with:', id, updates);
        const tasks = await _loadInternal();
        console.log('loaded tasks:', tasks);

        const idx = tasks.findIndex(t => t.id === id);
        console.log('found index:', idx);

        if (idx === -1) {
            console.log('Task not found with id:', id);
            return null;
        }

        const prev = tasks[idx];
        console.log('previous task:', prev);

        tasks[idx] = {
            ...prev,
            ...('title' in updates && updates.title !== undefined ? { title: (updates.title || '').toString().trim() || prev.title } : {}),
            ...('completed' in updates && updates.completed !== undefined ? { completed: !!updates.completed } : {}),
            updatedAt: new Date().toISOString()
        };

        console.log('updated task:', tasks[idx]);

        await _saveInternal(tasks);
        console.log('saved tasks successfully');

        return tasks[idx];
    });
}

async function remove(id) {
    return withFileLock(async () => {
        console.log('todoStore.remove called with:', id);
        const tasks = await _loadInternal();
        console.log('loaded tasks for removal:', tasks);

        const idx = tasks.findIndex(t => t.id === id);
        console.log('found index for removal:', idx);

        if (idx === -1) {
            console.log('Task not found for removal with id:', id);
            return false;
        }

        const removedTask = tasks[idx];
        console.log('removing task:', removedTask);

        tasks.splice(idx, 1);
        console.log('tasks after removal:', tasks);

        await _saveInternal(tasks);
        console.log('saved tasks after removal');

        return true;
    });
}

module.exports = { getAll, create, update, remove };
