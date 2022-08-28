export function getCreateChildVisualElementByClass(parent: HTMLElement, className: string) : HTMLElement 
{
    let element: HTMLElement | null = parent.querySelector(`.${className}`);
    if(element === null)
    {
        element = document.createElement("div");
        element.classList.add(className);
        parent.appendChild(element);
    }

    return element;
}