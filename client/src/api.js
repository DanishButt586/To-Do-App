const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

async function safeJsonParse(response) {
    const text = await response.text();
    if (!text || text.trim() === '') {
        console.warn('Empty response received from server');
        return { ok: false, message: 'Server returned empty response' };
    }
    try {
        return JSON.parse(text);
    } catch {
        console.error('JSON parse error. Response text:', text);
        return { ok: false, message: 'Server returned invalid JSON' };
    }
}

async function retryableRequest(requestFn, maxRetries = 3, retryDelay = 300) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await requestFn();
            return result;
        } catch (error) {
            console.warn(`Request attempt ${attempt} failed:`, error.message);

            if (attempt === maxRetries) {
                throw error;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
    }
}

export async function fetchTodos() {
    return retryableRequest(async () => {
        const res = await fetch('/api/todos');
        const data = await safeJsonParse(res);
        if (!res.ok || !data.ok) throw new Error(data.message || 'Failed to load');
        return data.tasks;
    });
}

export async function createTodo(title) {
    return retryableRequest(async () => {
        const res = await fetch('/api/todos', json('POST', { title }));
        const data = await safeJsonParse(res);
        if (!res.ok || !data.ok) throw new Error(data.message || 'Failed to create');
        return data.task;
    });
}

export async function updateTodo(id, updates) {
    console.log('updateTodo called with:', id, updates);
    return retryableRequest(async () => {
        const res = await fetch(`/api/todos/${id}`, json('PATCH', updates));
        const data = await safeJsonParse(res);
        console.log('updateTodo response:', res.status, data);
        if (!res.ok || !data.ok) throw new Error(data.message || 'Failed to update');
        return data.task;
    });
}

export async function deleteTodo(id) {
    console.log('deleteTodo called with:', id);
    return retryableRequest(async () => {
        const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
        const data = await safeJsonParse(res);
        console.log('deleteTodo response:', res.status, data);
        if (!res.ok || !data.ok) throw new Error(data.message || 'Failed to delete');
        return true;
    });
}
