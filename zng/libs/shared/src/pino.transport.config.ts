import { ConfigService } from '@nestjs/config';

export function getPinoTransports(configService: ConfigService): any[] {
  const logToFile = configService.get('IS_LOCAL') === '1';
  const logLevel = configService.get<string>('LOG_LEVEL') || 'debug';

  if (!logToFile) {
    return [
      {
        target: 'pino-pretty',
        level: logLevel,
        options: {
          colorize: configService.get('COLORIZE_LOGS') === 'true',
          singleLine: true,
          levelFirst: false,
          translateTime: "yyyy-mm-dd'T'HH:MM:ss'Z'",
          ignore: 'pid,hostname,res,responseTime,req.query,req.params,req.headers,req.body,req.route,req.host,req.remoteAddress,req.remotePort',
          errorLikeObjectKeys: ['err', 'error'],
        },
      },
    ];
  }

  return [
    {
      target: 'pino-pretty',
      level: logLevel,
      options: {
        colorize: configService.get('COLORIZE_LOGS') === 'true',
        singleLine: true,
        levelFirst: false,
        translateTime: "yyyy-mm-dd'T'HH:MM:ss'Z'",
        ignore: 'pid,hostname,res,responseTime,req.query,req.params,req.headers,req.body,req.route,req.host,req.remoteAddress,req.remotePort',
        errorLikeObjectKeys: ['err', 'error'],
      },
    },
    { target: 'pino/file', level: logLevel, options: { destination: `./logs/${configService.get('LOG_LEVEL') || 'debug'}/app.log`, mkdir: true } },
  ];
}
