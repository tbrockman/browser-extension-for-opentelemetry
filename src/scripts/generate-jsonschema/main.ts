import { createProgram, createParser, SchemaGenerator, createFormatter, DEFAULT_CONFIG } from "ts-json-schema-generator"
import fs from 'fs';

const config = {
    ...DEFAULT_CONFIG,
    path: 'src/storage/local/configuration/index.ts',
    tsconfig: 'tsconfig.json',
    type: 'UserFacingConfigurationType',
    topRef: false,
    schemaId: 'Configuration',
    jsDoc: 'extended' as const,
}
const program = createProgram(config);
const parser = createParser(program, config);
const formatter = createFormatter(config);
const generator = new SchemaGenerator(program, parser, formatter, config);
const outputPath = 'src/generated/schemas/configuration.schema.json';
const schema = generator.createSchema(config.type);
fs.mkdirSync('src/generated/schemas', { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));