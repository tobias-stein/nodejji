import { Node } from "@/components/nodes";

import { ThisPin } from "@/components/pins/ThisPin";
import { BooleanPin } from "@/components/pins/BooleanPin";
import { NumberPin } from "@/components/pins/NumberPin";
import { StringPin } from "@/components/pins/StringPin";
import { ObjectPin } from "@/components/pins/ObjectPin";
import { IODirection, PinValueReferenceType, PinValueAccess } from "@/types";

export class JsonObjectNode extends Node
{
    private object: any;

    public constructor(object: any)
    {
        super();

        this.object = object;

        this.generateInputs();
        this.generateOutputs();
    }

    private generateInputs() : void 
    {
        this.inputs.push(new ThisPin(this, this.object));
    }

    private generateOutputs() : void 
    {
        for(const fieldName in this.object)
        {
            let pin = undefined;
            
            const ref: PinValueReferenceType = { target: this.object, field: fieldName };

            switch(typeof this.object[fieldName])
            {
                case 'boolean': pin = new BooleanPin(IODirection.Output, this, ref, PinValueAccess.ByReference); break;
                case 'number': pin = new NumberPin(IODirection.Output, this, ref, PinValueAccess.ByReference); break;
                case 'string': pin = new StringPin(IODirection.Output, this, ref, PinValueAccess.ByReference); break;
                case 'object': pin = new ObjectPin(IODirection.Output, this, ref, PinValueAccess.ByReference); break;
                default:
                    throw new Error(`Unsupported value type '${typeof this.object[fieldName]}'!`);
            }

            pin.label = fieldName;
            this.outputs.push(pin);
        }
    }
}