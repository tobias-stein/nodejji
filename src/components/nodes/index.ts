import { 
    NodejjiType, 
    INode, 
    IPin, 
    IODirection,
    CustomVisualElementRenderer
} from "@/types";
import newUUID from "@/utils/uuid";


export abstract class Node implements INode
{
    public readonly uuid:   string;
    public readonly type:   NodejjiType;

    public meta:            { [key: string]: string; } | undefined;

    public inputs:          Array<IPin<IODirection.Input>>;
    public outputs:         Array<IPin<IODirection.Output>>;

    public visual:          HTMLElement | undefined;
    public style:           Partial<CSSStyleDeclaration>;

    public label:           string;

    public x:               number;
    public y:               number;   


    public constructor()
    {
        this.type = NodejjiType.Node;
        this.uuid = newUUID();
        this.label = this.uuid;

        this.inputs = new Array<IPin<IODirection.Input>>();
        this.outputs = new Array<IPin<IODirection.Output>>();

        this.x = 0;
        this.y = 0;

        this.visual = undefined;
        this.style = {};
    }
}

interface NodeFactoryConstructor 
{
    new(...args: any[]): any;
}

export class NodeFactory
{
    private static factories = new Map<string, NodeFactoryConstructor>();
    
    public static add(key: string, factory: NodeFactoryConstructor) : void 
    {
        if(NodeFactory.factories.has(key))
        {
            throw new Error(`Node factory with the key "${key}" already exists!`);
        }

        NodeFactory.factories.set(key, factory);
    }
    
    public static del(key: string) { NodeFactory.factories.delete(key); }
    public static clear() { NodeFactory.factories.clear(); }

    public static create<T extends INode>(key: NodeFactoryConstructor | string, x: number, y: number, label: string, ...args: Array<any>) : T
    {
        let newNode = undefined;
        
        if(typeof key === 'string') 
        {
            const factory = NodeFactory.factories.get(key);
            if(factory === undefined) { throw new Error(`Trying to create new node with unknown factory '${key}'!`); }

            newNode = new factory(...args);
        }
        else { newNode = new key(...args); }

        if(newNode.type !== NodejjiType.Node) { throw new Error(`Resulting type is not a node!`); }

        newNode.x = x;
        newNode.y = y;
        newNode.label = label;
        
        return newNode;
    }
}