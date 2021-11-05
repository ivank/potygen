#!/usr/bin/env node

import { psqlTsCommand } from './psql-ts.command';

psqlTsCommand().parse(process.argv);
