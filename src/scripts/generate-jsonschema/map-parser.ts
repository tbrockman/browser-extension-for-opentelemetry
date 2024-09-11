import type { BaseType, Context, ReferenceType, SubNodeParser } from "ts-json-schema-generator";
import { ObjectType, ts } from "ts-json-schema-generator";

// Not technically necessary since we're not exposing Maps to users anymore

export class MapConstructorParser implements SubNodeParser {
    public supportsNode(node: ts.Node): boolean {
        if (node.kind === ts.SyntaxKind.TypeReference) {
            const typeNode = node as ts.TypeReferenceNode;
            if (typeNode.typeName.getText() === 'Map') {
                if (typeNode.typeArguments) {
                    const [keyType, _] = typeNode.typeArguments;
                    if (keyType.getText() === 'string') {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public createType(node: ts.Node, context: Context, reference?: ReferenceType): BaseType | undefined {
        // TODO: handle Map<string, any> instead of just Map<string, string>
        return new ObjectType('Map', [], [], true,);
    }
}