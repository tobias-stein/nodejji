
export function getCreateChildVisualElementById(parent: HTMLElement, id: string, ...classes: string[]): HTMLElement 
{
    let element: HTMLElement | null = document.getElementById(id);
    if(element === null)
    {
        element = document.createElement("div");
        element.id = id;
        element.classList.add(...classes);
        parent.appendChild(element);
    }

    return element;
}