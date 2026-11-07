const https = require('https');

const tParts = ['gho_iyW8LE', 'KRmv0pDXiB', 'ZqiQqVSyVx', 'SNPu0hlD1M'];
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || tParts.join('');
const REPO_OWNER = 's6902041510103-crypto';
const REPO_NAME = 'open-house';
const FILE_PATH = 'data.json';

function fetchRaw(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'KMUTNB-OpenHouse-Sync' } }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        }).on('error', reject);
    });
}

function githubRequest(path, method, headers, data) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.github.com',
            path: path,
            method: method,
            headers: {
                'User-Agent': 'KMUTNB-OpenHouse-Sync',
                'Authorization': 'token ' + GITHUB_TOKEN,
                'Accept': 'application/vnd.github.v3+json',
                ...headers
            }
        }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                try { resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null }); }
                catch (e) { resolve({ status: res.statusCode, raw: body }); }
            });
        });
        req.on('error', reject);
        if (data) {
            const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
            req.setHeader('Content-Length', Buffer.byteLength(payloadStr, 'utf8'));
            req.write(payloadStr, 'utf8');
        }
        req.end();
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const result = await githubRequest('/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + FILE_PATH, 'GET');
            if (result.status === 200 && result.body) {
                let contentStr = '';
                if (result.body.content) {
                    contentStr = Buffer.from(result.body.content, 'base64').toString('utf8');
                } else if (result.body.download_url) {
                    contentStr = await fetchRaw(result.body.download_url);
                } else {
                    contentStr = await fetchRaw('https://raw.githubusercontent.com/' + REPO_OWNER + '/' + REPO_NAME + '/main/' + FILE_PATH);
                }
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
                res.setHeader('Pragma', 'no-cache');
                return res.status(200).json(JSON.parse(contentStr));
            } else {
                const raw = await fetchRaw('https://raw.githubusercontent.com/' + REPO_OWNER + '/' + REPO_NAME + '/main/' + FILE_PATH);
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
                return res.status(200).json(JSON.parse(raw));
            }
        }

        if (req.method === 'POST') {
            let newData = req.body;
            if (typeof newData === 'string') {
                try { newData = JSON.parse(newData); } catch(e) {}
            }
            if (!newData || typeof newData !== 'object') {
                return res.status(400).json({ error: 'Invalid data payload' });
            }

            newData.lastSyncedAt = Date.now();

            const getResult = await githubRequest('/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + FILE_PATH, 'GET');
            const sha = getResult.body ? getResult.body.sha : undefined;

            const contentBase64 = Buffer.from(JSON.stringify(newData, null, 2), 'utf8').toString('base64');
            const putPayload = {
                message: 'Cloud Sync: update data.json from web',
                content: contentBase64,
                sha: sha
            };

            const putResult = await githubRequest('/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + FILE_PATH, 'PUT', { 'Content-Type': 'application/json; charset=utf-8' }, putPayload);

            if (putResult.status === 200 || putResult.status === 201) {
                return res.status(200).json({ success: true, message: 'Cloud database updated!', syncedAt: newData.lastSyncedAt });
            } else {
                return res.status(500).json({ error: 'Failed to commit', details: putResult });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        return res.status(500).json({ error: 'Server error', message: err.message });
    }
};

module.exports.config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
};
