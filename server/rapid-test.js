const fetch = require('node-fetch').default || require('node-fetch');

async function testRapidClicking() {
    console.log('🧪 Testing rapid clicking scenario...');

    const BASE_URL = 'http://localhost:5000';

    try {
        // Create a test task
        console.log('Creating test task...');
        const createRes = await fetch(`${BASE_URL}/api/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Rapid Click Test' })
        });
        const createData = await createRes.json();
        const taskId = createData.task.id;
        console.log('✅ Created task:', taskId);

        // Rapid clicking simulation - multiple concurrent requests
        console.log('🚀 Simulating rapid clicking (concurrent requests)...');

        const rapidRequests = [];
        const toggleStates = [true, false, true, false, true];

        for (let i = 0; i < toggleStates.length; i++) {
            rapidRequests.push(
                fetch(`${BASE_URL}/api/todos/${taskId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completed: toggleStates[i] })
                }).then(res => res.json())
            );
        }

        // Wait for all requests to complete
        const results = await Promise.all(rapidRequests);

        console.log('✅ All rapid requests completed:');
        results.forEach((result, i) => {
            console.log(`   Request ${i + 1}: ${result.ok ? 'SUCCESS' : 'FAILED'} - ${result.task?.completed ?? 'ERROR'}`);
        });

        // Clean up
        await fetch(`${BASE_URL}/api/todos/${taskId}`, { method: 'DELETE' });
        console.log('✅ Cleaned up test task');

        const successCount = results.filter(r => r.ok).length;
        console.log(`🎉 Result: ${successCount}/${results.length} requests succeeded!`);

        if (successCount === results.length) {
            console.log('🎉 SUCCESS: No "Empty response from server" errors!');
        } else {
            console.log('⚠️  Some requests failed - check error handling');
        }

    } catch (error) {
        console.log('❌ FAILED:', error.message);
    }
}

testRapidClicking();