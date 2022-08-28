
export interface IStateChangeObserver 
{ 
    onUpdate: (items: Array<INode | ILink | IPin>) => void; 
}

export type NodeSchemaId = string;

export enum NodifyType 
{
    Graph = 0,
    Node,
    Link,
    Pin
}

export interface Meta 
{
    readonly uuid:  string;
    type:           NodifyType;

    meta?:           { [key: string]: string }
}

export interface CustomVisualElementRenderer<T extends HTMLElement | SVGPathElement> 
{
    renderer?(parent: T): T;
}

export interface VisualElement<T extends HTMLElement | SVGPathElement> extends CustomVisualElementRenderer<T>
{
    visual:         T | undefined;
    style:          Partial<CSSStyleDeclaration>;
}

export interface NodeIO 
{
    inputs:         Array<IPin<IODirection.Input>>;
    outputs:        Array<IPin<IODirection.Output>>;
}

export interface INode extends Meta, NodeIO, VisualElement<HTMLElement>
{
    label:          string;

    x:              number;
    y:              number;
}

export enum IODirection { Input = 0, Output = 1 };

export interface PinValueReferenceType 
{
    target:     object;
    field:      string;
}

export type PinValueType = string | number | boolean | object | PinValueReferenceType | undefined;

export enum PinValueAccess { Value = 0, ByReference, This };


export type PinArchTypeId = string;

export interface IPin<TDirection extends IODirection = IODirection> extends Meta, VisualElement<HTMLElement>
{
    readonly direction: TDirection;

    readonly pinType:   PinArchTypeId;
    
    parent:             INode;
    connection:         ILink | undefined;

    label:              string;

    valueAccess:        PinValueAccess;
    value:              PinValueType;
}


export interface ILink extends Meta, VisualElement<SVGPathElement>
{
    output:             IPin<IODirection.Output>;
    input:              IPin<IODirection.Input>;
}

export interface ScaledCanvasRect
{ 
    rect: DOMRect;
    scaleX: number;
    scaleY: number 
}

export interface IRender 
{
    readonly canvas: HTMLElement;
    canvasRect: ScaledCanvasRect;
}

export interface IContext extends EventTarget
{
    readonly frame: HTMLElement;
    readonly renderer: IRender;

    getNode(element: HTMLElement): INode;

    addNode(node: INode): void;
    addLink(link: ILink): void;
    delNode(node: INode): void;
    delLink(link: ILink): void;

    clearSelection() : void;

    singleSelect(node: INode): void;
    muliSelect(nodes: Array<INode>): void; 

    rangeSelect(range: DOMRect) : void;

    moveNode(node: INode, dtX: number, dtY: number): void;
}