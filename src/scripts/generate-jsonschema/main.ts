import { createProgram, createParser, SchemaGenerator, createFormatter, DEFAULT_CONFIG } from "ts-json-schema-generator"
import { MapConstructorParser } from "./map-parser";
import fs from 'fs';

const config = {
    ...DEFAULT_CONFIG,
    path: 'src/utils/storage.ts',
    tsconfig: 'tsconfig.json',
    type: 'LocalStoragePublic',
    topRef: false,
    schemaId: 'Configuration',
}
const program = createProgram(config);
const parser = createParser(program, config, (prs) => {
    prs.addNodeParser(new MapConstructorParser());
});
const formatter = createFormatter(config);
const generator = new SchemaGenerator(program, parser, formatter, config);
const outputPath = 'src/generated/schemas/configuration.schema.json';
const schema = generator.createSchema(config.type);
fs.mkdirSync('src/generated/schemas', { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));