const fs = require('fs');
const path = require('path');
const http = require('http');

const MIMES = {
	css: 'text/css',
	js: 'application/javascript',
	json: 'application/json',
	gif: 'image/gif',
	png: 'image/png',
	jpg: 'image/jpeg',
};

function handler(req, res) {
	// console.log('req', req.url, req.headers);
	const accept = req.headers.accept;
	const matches = req.url.match(/\.(js|css|gif|png|jpg|json)$/);
	if (matches) {
		const ext = matches[1];
		const fpath = __dirname + req.url;
		if (!fs.existsSync(fpath)) {
			res.writeHead(404);
			res.write('Page not found');
			return;
		}
		const content = fs.readFileSync(fpath);
		const contentType = MIMES[ext];
		res.writeHead(200, {
			'Content-Type': contentType
		});
		res.write(content);
	}
	else {
		const content = fs.readFileSync(path.join(__dirname, 'index.html'));
		res.writeHead(200, {
			'Content-Type': 'text/html; charset=utf-8'
		});
		res.write(content);
	}
	res.end();
}

const port = process.env.NODE_PORT || 4000;
const server = http.createServer(handler);
server.on('error', function(err) {
	console.error(err);
	process.exit(1);
});
server.listen(port, function (err) {
	if (err) return console.error(err);
	console.log('[server] is running on port:%d pid:%d', port, process.pid)
});

process.on('SIGTERM', function() {
	console.log('SIGTERM');
	server.close(() => {
		console.log('[server] closed');
		process.exit(0);
	})
})
