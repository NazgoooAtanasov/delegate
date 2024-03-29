chrome.runtime.onMessage.addListener((message: { eventName: string } & Record<string, unknown>, _, __) => {
  if (message.eventName === "scrollIntoView") {
    const { selector } = message as {
      eventName: string;
      selector: string;
    };

    const domElement: HTMLElement | null = document.querySelector(selector);
    if (!domElement) {
      console.warn("Element not found", selector);
      return false;
    }

    domElement.scrollIntoView({ behavior: "smooth", block: "center" });
    domElement.style.padding = "20px";
    domElement.style.background = "red";
    setTimeout(() => {
      domElement.style.padding = "";
      domElement.style.background = "";
    }, 3000);
  }
  return false;
});

function serializeDomToObject(element: Element): {
  elementName: string;
  attributes: string[][];
} {
  const target: HTMLElement = (element as HTMLElement) ?? null;

  const attributes: string[][] = [...target.attributes].map((attr) => {
    return [attr.name, attr.value];
  });

  const elementName = target.tagName.toLowerCase();
  return { elementName, attributes };
}

function getDomElementSelector({ elementName, attributes }: { elementName: string; attributes: string[][] }): string {
  let selector = `${elementName}`;
  const attributeSelectors = attributes
    .map(([key, value]) => {
      return `[${key}="${value}"]`;
    })
    .join("");
  selector += attributeSelectors;
  return selector;
}

async function sendMessage(message: {
  eventName: string;
  url: string;
  activityTitle: string | null;
  elementName: string;
  attributes: string[][];
  selector: string;
  action: "click";
}) {
  try {
    await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.warn("There was an error sending activity message", error);
  }
}

document.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;
  const targetObject = serializeDomToObject(target);
  let targetSelector = getDomElementSelector(targetObject);
  let elementsWithTheSameSelectors = document.querySelectorAll(targetSelector);
  if (elementsWithTheSameSelectors.length === 1) {
    await sendMessage({
      eventName: "addActivity",
      url: window.location.toString(),
      activityTitle: target.textContent,
      elementName: targetObject.elementName,
      attributes: targetObject.attributes,
      selector: targetSelector,
      action: "click",
    });
    return;
  }

  const idx = [...target.parentElement!.children].findIndex((el) => el === target) + 1;
  targetSelector = targetSelector + `:nth-child(${idx})`;

  let lastParent = target;
  while (elementsWithTheSameSelectors.length !== 1) {
    const newTarget = lastParent.parentElement!;
    const newTargetObject = serializeDomToObject(newTarget);
    let newTargetSelector = getDomElementSelector(newTargetObject);
    const idx = [...newTarget.parentElement!.children].findIndex((el) => el === newTarget) + 1;
    newTargetSelector += `:nth-child(${idx})`;
    targetSelector = newTargetSelector + " " + targetSelector;
    elementsWithTheSameSelectors = document.querySelectorAll(targetSelector);
    lastParent = newTarget;
    if (elementsWithTheSameSelectors.length <= 0) {
      targetSelector = targetSelector.replace(newTargetSelector + " ", "");
      break;
    }
  }

  await sendMessage({
    eventName: "addActivity",
    action: "click",
    url: window.location.toString(),
    activityTitle: target.textContent,
    elementName: targetObject.elementName,
    attributes: targetObject.attributes,
    selector: targetSelector,
  });
});
