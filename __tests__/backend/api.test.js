/**
 * API Integration Tests
 * Tests for Contract Generator backend API endpoints
 */

const request = require('supertest');
const app = require('../../server');
const { closeDatabase } = require('../../backend/config/database');

// Close database after all tests to prevent async warnings
afterAll((done) => {
    closeDatabase();
    // Give database time to close
    setTimeout(done, 100);
});

describe('Health API', () => {
    test('GET /api/health returns OK status', async () => {
        const response = await request(app).get('/api/health');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('status', 'OK');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('version', '4.3.0');
    });
});

describe('Flows API', () => {
    test('GET /api/flows returns array of flows', async () => {
        const response = await request(app).get('/api/flows');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/flows/:flowId returns specific flow', async () => {
        const response = await request(app).get('/api/flows/basis-flow');

        if (response.statusCode === 200) {
            expect(response.body).toHaveProperty('flow_id');
            expect(response.body).toHaveProperty('naam');
            expect(response.body).toHaveProperty('stappen');
        } else {
            // Flow might not exist yet
            expect(response.statusCode).toBe(404);
        }
    });

    test('GET /api/flows/:flowId with non-existent ID returns 404', async () => {
        const response = await request(app).get('/api/flows/non-existent-flow-12345');

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('error');
    });
});

describe('Clausules API', () => {
    test('GET /api/clausules returns array of clausules', async () => {
        const response = await request(app).get('/api/clausules');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/clausules/categories returns array of categories', async () => {
        const response = await request(app).get('/api/clausules/categories');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/clausules with categorie filter works', async () => {
        const response = await request(app).get('/api/clausules?categorie=test');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});

describe('404 Handling', () => {
    test('GET /api/non-existent returns 404', async () => {
        const response = await request(app).get('/api/non-existent-endpoint');

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('error');
    });
});

describe('CORS', () => {
    test('Allows requests from localhost:8080', async () => {
        const response = await request(app)
            .get('/api/health')
            .set('Origin', 'http://localhost:8080');

        expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
});
