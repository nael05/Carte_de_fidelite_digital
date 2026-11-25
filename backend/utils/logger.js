import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

const isDev = process.env.NODE_ENV !== 'production';

// Les journaux vont toujours dans backend/logs, quel que soit le dossier de lancement.
const logsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    : winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: isDev
        ? winston.format.simple()
        : winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(winston.format.uncolorize(), winston.format.timestamp(), winston.format.json()),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    isDev
      ? null
      : new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
  ].filter(Boolean),
});

export default logger;
