const { io } = require('socket.io-client');
const { server } = require('../server');

jest.setTimeout(60000);

let address;

beforeAll((done) => {
    server.listen(0, () => {
        address = server.address();
        done();
    });
});

afterAll((done) => {
        server.close(done);
});

describe('Realtime Chat', () => {
    
    let client1;
    let client2;

    beforeEach((done) => {
        client1 = io(`http://localhost:${address.port}`);
        client2 = io(`http://localhost:${address.port}`);

        let connected = 0;
        
        const onConnect = () => {
            connected++;

            if (connected === 2) {
                done();
            }
        };

        client1.on('connect', onConnect);
        client2.on('connect', onConnect);
    });

    afterEach((done) => {
        if (client1.connected) client1.disconnect();
        if (client2.connected) client2.disconnect();

        setTimeout(done, 100);
    });


    test('Must send messages between users', (done) => {

        client2.on('chat:message', (msg) => {

            expect(msg.text).toBe('Hello :3');
            expect(msg.sender).toBe('Miku');

            done();
        });

        client1.emit('user:join', {
            name: 'Miku'
        });

        client2.emit('user:join', {
            name: 'Chiikawa'
        });

        setTimeout(() => {
            client1.emit('chat:message', {
                text: 'Hello :3'
            });
        }, 100);
    });

    test('Must update online users list', (done) => {

        client1.emit('user:join', {
            name: 'Miku'
        });

        client2.emit('user:join', {
            name: 'Chiikawa'
        });

        client1.on('users:update', (users) => {

            if (users.length >= 2) {
                const names = users.map(u => u.name);

                expect(names).toContain('Miku');
                expect(names).toContain('Chiikawa');

                done();
            }
        });
    });

    test('Must notify when an user joins', (done) => {
        client2.on('chat:system', (msg) => {

            expect(msg.text).toContain('joined the chat');

            done();
        });

        client1.emit('user:join', {
            name: 'Miku'

        });
    });

    test('Must notify when an user leaves', (done) => {
        client1.emit('user:join', {
            name: 'Miku'
        });

        client2.emit('user:join', {
            name: 'Chiikawa'
        });

        client2.on('chat:system', (msg) => {

            if (
                msg.text === 'Miku left the chat'
            ) {
                expect(msg.text).toBe('Miku left the chat');
                done();
            }
        });

        setTimeout(() => {
            client1.disconnect();
        }, 200);
    });

    test('Must remove disconnected users from the list', (done) => {

        client1.emit('user:join', { name: 'Miku' });
        client2.emit('user:join', { name: 'Chiikawa' });

        let disconnected = false;

        client2.on('users:update', (users) => {

            const names = users.map(u => u.name);

            if (!disconnected && names.includes('Miku') && names.includes('Chiikawa')) {
                disconnected = true;

                setTimeout(() => {
                    client1.disconnect();
                }, 100);

                return;
            }

            if (disconnected && !names.includes('Miku')) {
                expect(names).not.toContain('Miku');
                expect(names).toContain('Chiikawa');
                done();
            }
        });
    });
});