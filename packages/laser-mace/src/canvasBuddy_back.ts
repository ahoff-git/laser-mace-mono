import { createLazyState } from "./lazyState";
import { log, logLevels } from "./logging";
import { defineComputedProperties } from "./utils";

export type DrawOptions = {
  color?: string; // Fill or stroke color
  transparency?: number; // Transparency from 0 to 1
  rotationAngle?: number; // Angle in degrees
  rotationOrigin?: "center" | "corner"; // Origin for rotation
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"; // Anchor point for positioning
  fontSize?: number; // Font size for text
  textAlign?: "left" | "right" | "center"; // Text alignment
  verticalAlign?: "top" | "middle" | "bottom"; // Vertical alignment for text
  offsetX?: number; // Offset on the x-axis
  offsetY?: number; // Offset on the y-axis
  showAnchor?: boolean; // Show anchor point on canvas
  returnDetails?: boolean; // set to return the bounding box numbers 
};

export type ShapeDetails = {
  center: { x: number; y: number };
  min: { x: number; y: number };
  max: { x: number; y: number };
  anchor: { x: number; y: number };
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
  topCenter: { x: number; y: number };
  bottomCenter: { x: number; y: number };
  leftCenter: { x: number; y: number };
  rightCenter: { x: number; y: number };
  dimensions: { width: number; height: number };
};

export type BoundingBox = { 
  center: { x: number; y: number; }; 
  min: { x: number; y: number; }; 
  max: { x: number; y: number; }; 
  anchor: { x: number; y: number; }; 
  topLeft: { x: number; y: number; }; 
  topRight: { x: number; y: number; }; 
  bottomLeft: { x: number; y: number; }; 
  bottomRight: { x: number; y: number; }; 
  topCenter: { x: number; y: number; }; 
  bottomCenter: { x: number; y: number; }; 
  leftCenter: { x: number; y: number; }; 
  rightCenter: { x: number; y: number; }; 
  dimensions: { width: number; height: number; }; } | undefined

export   // Utility to calculate bounding box
function calculateBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number,
  options: DrawOptions = {returnDetails: true},
  isCircle: boolean = false
) {
  //by default we skip this whole function, but if you want the box, you can set the 'returnDetails' option
  if (!options.returnDetails) { return }
  const {
    rotationAngle = 0,
    rotationOrigin = "center",
    anchor = "top-left",
  } = options;
  const radians = (rotationAngle * Math.PI) / 180;

  // Determine center of the bounding shape
  const centerX = rotationOrigin === "center" ? x + width / 2 : x;
  const centerY = rotationOrigin === "center" ? y + height / 2 : y;

  // Compute anchor position
  let anchorX = x;
  let anchorY = y;

  switch (anchor) {
    case "top-left":
      break; // No adjustment needed
    case "top-right":
      anchorX += width;
      break;
    case "bottom-left":
      anchorY += height;
      break;
    case "bottom-right":
      anchorX += width;
      anchorY += height;
      break;
    case "center":
      anchorX += width / 2;
      anchorY += height / 2;
      break;
  }

  // Special handling for circles
  if (isCircle) {
    const radius = width / 2; // For circles, width and height are treated as diameter
    return {
      center: { x: centerX, y: centerY },
      min: { x: centerX - radius, y: centerY - radius },
      max: { x: centerX + radius, y: centerY + radius },
      anchor: { x: anchorX, y: anchorY },
      topLeft: { x: centerX - radius, y: centerY - radius },
      topRight: { x: centerX + radius, y: centerY - radius },
      bottomLeft: { x: centerX - radius, y: centerY + radius },
      bottomRight: { x: centerX + radius, y: centerY + radius },
      topCenter: { x: centerX, y: centerY - radius },
      bottomCenter: { x: centerX, y: centerY + radius },
      leftCenter: { x: centerX - radius, y: centerY },
      rightCenter: { x: centerX + radius, y: centerY },
      dimensions: {
        width: radius * 2,
        height: radius * 2,
      },
    };
  }

  // Original bounding box logic for rectangles and other shapes
  const corners = [
    { x: x, y: y }, // Top-left
    { x: x + width, y: y }, // Top-right
    { x: x, y: y + height }, // Bottom-left
    { x: x + width, y: y + height }, // Bottom-right
  ];

  const rotatedCorners = corners.map((corner) => {
    const dx = corner.x - centerX;
    const dy = corner.y - centerY;
    return {
      x: centerX + dx * Math.cos(radians) - dy * Math.sin(radians),
      y: centerY + dx * Math.sin(radians) + dy * Math.cos(radians),
    };
  });

  const xs = rotatedCorners.map((corner) => corner.x);
  const ys = rotatedCorners.map((corner) => corner.y);

  const retVal = {
    center: { x: centerX, y: centerY },
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
    anchor: { x: anchorX, y: anchorY },
    topLeft: rotatedCorners[0],
    topRight: rotatedCorners[1],
    bottomLeft: rotatedCorners[2],
    bottomRight: rotatedCorners[3],
    topCenter: {
      x: (rotatedCorners[0].x + rotatedCorners[1].x) / 2,
      y: rotatedCorners[0].y,
    },
    bottomCenter: {
      x: (rotatedCorners[2].x + rotatedCorners[3].x) / 2,
      y: rotatedCorners[2].y,
    },
    leftCenter: {
      x: rotatedCorners[0].x,
      y: (rotatedCorners[0].y + rotatedCorners[2].y) / 2,
    },
    rightCenter: {
      x: rotatedCorners[1].x,
      y: (rotatedCorners[1].y + rotatedCorners[3].y) / 2,
    },
    dimensions: {
      width: Math.abs(Math.max(...xs) - Math.min(...xs)),
      height: Math.abs(Math.max(...ys) - Math.min(...ys)),
    },
  };
  log(logLevels.debug, "CalcBoundingBox ran:",['calculateBoundingBox', 'spam'] ,retVal,)
  return retVal;
}

export type CanvasBuddy = {
  drawCircle: (x: number, y: number, radius: number, options?: DrawOptions) => ShapeDetails | undefined;
  drawSquare: (x: number, y: number, width: number, options?: DrawOptions) => ShapeDetails | undefined;
  drawText: (text: string, x: number, y: number, options?: DrawOptions) => ShapeDetails | undefined;
  drawImage: (image: HTMLImageElement, x: number, y: number, width: number, height: number, options?: DrawOptions) => ShapeDetails | undefined;
  markBoundingBoxLocations: (boundingBox: ShapeDetails, excludeKeys?: Array<ShapeDetails>) => void;
  eraseArea: (x: number, y: number, width: number, height: number) => void;
  clearCanvas: () => void;
  clearBoundingBox: (boundingBox: ShapeDetails) => void;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}


export function createCanvasBuddy(canvas: HTMLCanvasElement): CanvasBuddy {
  const ctx = canvas.getContext("2d")!;

  const canvasState = createLazyState({
    canvasDetails: ['timed', _getCanvasDetails, 1000]
  })

  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }

  function getCanvasDetails() {
    return canvasState.canvasDetails;
  }

  function _getCanvasDetails() {
    const { width, height } = canvas; // Canvas width and height
    const rect = canvas.getBoundingClientRect(); // Canvas location on the page

    return {
      width, // Canvas width in pixels
      height, // Canvas height in pixels
      location: {
        top: rect.top, // Distance from the top of the viewport
        left: rect.left, // Distance from the left of the viewport
        right: rect.right, // Distance from the left + width
        bottom: rect.bottom, // Distance from the top + height
      },
    };
  }


  function applyOptions(options: DrawOptions = {}) {
    // Reset to default values
    ctx.fillStyle = "#000"; // Default color: black
    ctx.globalAlpha = 1; // Default transparency: fully opaque
    ctx.font = "16px sans-serif"; // Default font
    ctx.textAlign = "start"; // Default text alignment: start

    // Apply provided options
    if (options.color) ctx.fillStyle = options.color;
    if (options.transparency !== undefined) {
      if (options.transparency < 0 || options.transparency > 1) {
        console.error(
          "Transparency must be between 0 and 1. Setting to default (1)."
        );
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = options.transparency;
      }
    }
    if (options.fontSize) {
      if (typeof options.fontSize !== "number" || options.fontSize <= 0) {
        console.error(
          "Font size must be a positive number. Setting to default (16px)."
        );
        ctx.font = "16px sans-serif";
      } else {
        ctx.font = `${options.fontSize}px sans-serif`;
      }
    }
    if (options.textAlign) ctx.textAlign = options.textAlign;
  }

  // Utility to handle rotation
  function handleRotation(
    x: number,
    y: number,
    width: number,
    height: number,
    options: DrawOptions,
    callback: () => void
  ) {
    const { rotationAngle = 0, rotationOrigin = "center" } = options;

    if (rotationAngle === 0) {
      callback();
      return;
    }

    const radians = (rotationAngle * Math.PI) / 180;
    const centerX = rotationOrigin === "center" ? x + width / 2 : x;
    const centerY = rotationOrigin === "center" ? y + height / 2 : y;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(radians);
    ctx.translate(-centerX, -centerY);

    callback();

    ctx.restore();
  }

  // Draw the anchor point
  function drawAnchorPoint(x: number, y: number) {
    ctx.save();
    ctx.fillStyle = "limegreen";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Utility to adjust position based on anchor and offsets
  function adjustForAnchorAndOffset(
    x: number,
    y: number,
    width: number,
    height: number,
    options: DrawOptions
  ) {
    const { anchor = "top-left", offsetX = 0, offsetY = 0 } = options;
    let adjustedPosition = { x, y };

    switch (anchor) {
      case "top-right":
        adjustedPosition = { x: x - width, y };
        break;
      case "bottom-left":
        adjustedPosition = { x, y: y - height };
        break;
      case "bottom-right":
        adjustedPosition = { x: x - width, y: y - height };
        break;
      case "center":
        adjustedPosition = { x: x - width / 2, y: y - height / 2 };
        break;
    }

    return {
      x: adjustedPosition.x + offsetX,
      y: adjustedPosition.y + offsetY,
    };
  }

  // Utility to display the bounding box locations
  function markBoundingBoxLocations(
    boundingBox: ShapeDetails,
    excludeKeys: Array<ShapeDetails> = []
  ) {
    const locations = [
      { key: "center", point: boundingBox.center },
      { key: "min", point: boundingBox.min },
      { key: "max", point: boundingBox.max },
      { key: "anchor", point: boundingBox.anchor },
      { key: "topLeft", point: boundingBox.topLeft },
      { key: "topRight", point: boundingBox.topRight },
      { key: "bottomLeft", point: boundingBox.bottomLeft },
      { key: "bottomRight", point: boundingBox.bottomRight },
      { key: "topCenter", point: boundingBox.topCenter },
      { key: "bottomCenter", point: boundingBox.bottomCenter },
      { key: "leftCenter", point: boundingBox.leftCenter },
      { key: "rightCenter", point: boundingBox.rightCenter },
    ];

    const placedLabels: {
      x: number;
      y: number;
      textWidth: number;
      textHeight: number;
    }[] = [];

    locations.forEach(({ key, point }) => {
      if (excludeKeys.includes(key as any)) {
        return;
      }

      const dotSize = 5;
      // Draw a small circle at each point
      drawCircle(point.x, point.y, dotSize, {
        color: "red",
        showAnchor: false,
      });

      const capKey = key.toUpperCase();
      const textAlign = capKey.includes("LEFT")
        ? "right"
        : capKey.includes("RIGHT")
          ? "left"
          : "center";
      const verticalAlign = capKey.includes("BOTTOM") ? "bottom" : "top";

      // Default offset
      let textOffsetX =
        textAlign === "right" ? -dotSize : textAlign === "left" ? dotSize : 0;
      let textOffsetY = verticalAlign === "bottom" ? dotSize : -dotSize;

      // Check for overlap and adjust offset
      const fontSize = 12;
      const textWidth = ctx.measureText(key).width;
      const textHeight = fontSize; // Approximate height based on font size
      placedLabels.forEach((label) => {
        const distance = Math.sqrt(
          Math.pow(label.x - (point.x + textOffsetX), 2) +
          Math.pow(label.y - (point.y + textOffsetY), 2)
        );
        if (distance * 2 < Math.max(label.textWidth, textWidth)) {
          // Dynamically shift away from the center point
          const centerPoint = boundingBox.center;
          const dx = point.x - centerPoint.x;
          const dy = point.y - centerPoint.y;
          let isLeft = 0;
          let isBelow = 0;
          if (dx != 0) {
            isLeft = dx > 0 ? 1 : -1
          }
          if (dy != 0) {
            isBelow = dy > 0 ? 1 : -1
          }
          const stepSize = fontSize + dotSize / 2;
          textOffsetX += isLeft * stepSize;
          textOffsetY += isBelow * stepSize;
        }
      });

      // Add current label position to placedLabels
      placedLabels.push({
        x: point.x + textOffsetX,
        y: point.y + textOffsetY,
        textWidth,
        textHeight,
      });

      // Label each point
      drawText(key, point.x + textOffsetX, point.y + textOffsetY, {
        color: "black",
        fontSize: fontSize,
        textAlign,
        verticalAlign,
      });
    });
  }

  function drawCircle(
    x: number,
    y: number,
    radius: number,
    options: DrawOptions = {}
  ): ShapeDetails | undefined {
    applyOptions(options);

    const { x: adjustedX, y: adjustedY } = adjustForAnchorAndOffset(
      x,
      y,
      radius * 2,
      radius * 2,
      options
    );

    handleRotation(
      adjustedX - radius,
      adjustedY - radius,
      radius * 2,
      radius * 2,
      options,
      () => {
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    );

    if (options.showAnchor) {
      drawAnchorPoint(adjustedX, adjustedY);
    }

    return calculateBoundingBox(
      adjustedX - radius,
      adjustedY - radius,
      radius * 2,
      radius * 2,
      options,
      true
    );
  }

  function drawSquare(
    x: number,
    y: number,
    width: number,
    options: DrawOptions = {}
  ): ShapeDetails | undefined {
    applyOptions(options);

    const { x: adjustedX, y: adjustedY } = adjustForAnchorAndOffset(
      x,
      y,
      width,
      width,
      options
    );

    handleRotation(adjustedX, adjustedY, width, width, options, () => {
      ctx.fillRect(adjustedX, adjustedY, width, width);
    });

    if (options.showAnchor) {
      drawAnchorPoint(adjustedX, adjustedY);
    }

    return calculateBoundingBox(adjustedX, adjustedY, width, width, options);
  }

  function drawImage(
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    options: DrawOptions = {}
  ): ShapeDetails | undefined {
    const { x: adjustedX, y: adjustedY } = adjustForAnchorAndOffset(
      x,
      y,
      width,
      height,
      options
    );

    handleRotation(adjustedX, adjustedY, width, height, options, () => {
      ctx.save();
      applyOptions(options);
      ctx.drawImage(image, adjustedX, adjustedY, width, height);
      ctx.restore();
    });

    if (options.showAnchor) {
      drawAnchorPoint(adjustedX, adjustedY);
    }

    return calculateBoundingBox(adjustedX, adjustedY, width, height, options);
  }

  function drawText(
    text: string,
    x: number,
    y: number,
    options: DrawOptions = {}
  ): ShapeDetails | undefined {
    applyOptions(options);

    const textWidth = ctx.measureText(text).width;
    const fontSize = options.fontSize || 16; // Default font size
    const height = fontSize; // Approximation for text height

    const { x: adjustedX, y: adjustedY } = adjustForAnchorAndOffset(
      x,
      y,
      textWidth,
      height,
      options
    );

    const verticalOffset =
      options.verticalAlign === "middle"
        ? height / 2
        : options.verticalAlign === "bottom"
          ? height
          : 0;

    ctx.fillText(text, adjustedX, adjustedY + verticalOffset);

    if (options.showAnchor) {
      drawAnchorPoint(adjustedX, adjustedY);
    }

    return calculateBoundingBox(
      adjustedX,
      adjustedY,
      textWidth,
      height,
      options
    );
  }
  function eraseArea(x: number, y: number, width: number, height: number) {
    ctx.clearRect(x, y, width, height);
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function clearBoundingBox(boundingBox: ShapeDetails) {
    const { min, dimensions } = boundingBox;
    ctx.clearRect(min.x, min.y, dimensions.width, dimensions.height);
  }

  const retObj = {
    drawCircle,
    drawSquare,
    drawText,
    drawImage,
    markBoundingBoxLocations,
    eraseArea,
    clearCanvas,
    clearBoundingBox,
  } as CanvasBuddy;

  //width, height, top, left, right, bottom
  defineComputedProperties(retObj, [
    ['width', () => getCanvasDetails().width],
    ['height', () => getCanvasDetails().height],
    ['top', () => getCanvasDetails().location.top],
    ['left', () => getCanvasDetails().location.left],
    ['right', () => getCanvasDetails().location.right],
    ['bottom', () => getCanvasDetails().location.bottom],
  ]);

  retObj.width
  return retObj;
}
