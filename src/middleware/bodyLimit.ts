import express from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { BodyLimitConfig } from '../types';
import type { FailFn } from '../utils/error';

interface BodyParserError extends Error {
  type?: string;
  status?: number;
}

/**
 * Wraps express's built-in json/urlencoded parsers (already battle-tested,
 * no need to write our own parser) and converts their thrown "entity too
 * large" / malformed-JSON errors into the shield's unified error shape,
 * since Express's default error handler would otherwise return HTML.
 */
export function createBodyLimitMiddleware(config: BodyLimitConfig, fail: FailFn): RequestHandler {
  const jsonParser = express.json({ limit: config.json ?? '1mb' });
  const urlencodedParser = express.urlencoded({ extended: true, limit: config.urlencoded ?? config.json ?? '1mb' });
  

  return function bodyLimit(req: Request, res: Response, next: NextFunction) {
    jsonParser(req, res, (err: unknown) => {
      if (err) return handleParseError(err as BodyParserError, req, res, fail, next);
      urlencodedParser(req, res, (err2: unknown) => {
        if (err2) return handleParseError(err2 as BodyParserError, req, res, fail, next);
        next();
      });
    });
  };
  
}

function handleParseError(err: BodyParserError, req: Request, res: Response, fail: FailFn, next: NextFunction) {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return fail(req, res, 'BODY_TOO_LARGE', 'Request body exceeds the configured size limit');
  }
  // Malformed JSON etc: pass through to Express's normal error handling
  // rather than misreporting it as a size issue.
  next(err);

  if (err?.message === 'BODY_TOO_DEEP') {
  return fail(req, res, 'SUSPICIOUS_REQUEST', 'Nested JSON too deep');
}
}


