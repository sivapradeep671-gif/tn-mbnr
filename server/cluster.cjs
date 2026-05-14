const cluster = require('cluster');
const os = require('os');
const logger = require('./utils/logger.cjs');

if (cluster.isPrimary) {
    const numCPUs = process.env.WEB_CONCURRENCY || os.cpus().length;
    logger.info(`Primary process ${process.pid} is running`);
    logger.info(`Forking ${numCPUs} workers for production cluster...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else {
    // Workers share the TCP connection in this file
    require('./index.cjs');
    logger.info(`Worker ${process.pid} started and bound to shared port`);
}
