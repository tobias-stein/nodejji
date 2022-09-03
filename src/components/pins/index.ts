import { NodejjiType, INode, IPin, IODirection, PinArchTypeId, PinValueAccess, PinValueReferenceType, PinValueType, ILink } from "@/types";
import newUUID from "@/utils/uuid";


export abstract class Pin<TDirection extends IODirection = IODirection> implements IPin
{
    public readonly uuid:       string;
    public readonly type:       NodejjiType;

    public meta:                { [key: string]: string; } | undefined;
   
    public readonly direction:  TDirection;
    public parent:              INode;
    public connection:          ILink | undefined;
    public label:               string;
    public valueAccess:         PinValueAccess;
    public visual:              HTMLElement | undefined;
    public style:               Partial<CSSStyleDeclaration>;

    private _value:             PinValueType;

    public abstract pinType:    PinArchTypeId;


    public constructor(direction: TDirection, parent: INode, value: PinValueType, accessAs: PinValueAccess)
    {
        this.type = NodejjiType.Pin;
        this.uuid = newUUID();
        this.label = this.uuid;

        this.direction = direction;
        this.parent = parent;

        if(accessAs === PinValueAccess.ByReference && value === undefined || typeof value !== 'object')
        {
            throw new Error(`Pin value is declared as reference, expected string for value property!`);
        }

        this.valueAccess = accessAs;
        this._value = value;

        this.visual = undefined;
        this.style = {};
    }

    public get value() : PinValueType 
    {
        switch(this.valueAccess)
        {
            case PinValueAccess.Value: { return this._value; }
            case PinValueAccess.ByReference: 
            { 
                const ref: PinValueReferenceType = this._value as PinValueReferenceType;
                return (ref.target as any)[ref.field]; 
            }
            case PinValueAccess.This: { return this._value; }
        }

        throw new Error(`Unkown value access type ${this.valueAccess}`);
    }
}

interface PinFactoryConstructor 
{
    new(...args: any[]): any;
}

export class PinFactory
{
    private static factories = new Map<string, PinFactoryConstructor>();
    
    public static add(key: string, factory: PinFactoryConstructor) : void 
    {
        if(PinFactory.factories.has(key))
        {
            throw new Error(`Pin factory with the key "${key}" already exists!`);
        }

        PinFactory.factories.set(key, factory);
    }
    
    public static del(key: string) { PinFactory.factories.delete(key); }
    public static clear() { PinFactory.factories.clear(); }

    public static create<T extends IPin>(key: PinFactoryConstructor, ...args: Array<any>) : T
    {
        let newPin = undefined;
        
        if(typeof key === 'string') 
        {
            const factory = PinFactory.factories.get(key);
            if(factory === undefined) { throw new Error(`Trying to create new pin with unknown factory '${key}'!`); }

            newPin = new factory(...args);
        }
        else { newPin = new key(...args); }

        if(newPin.type !== NodejjiType.Pin) { throw new Error(`Resulting type is not a pin!`); }
        
        return newPin;
    }
}