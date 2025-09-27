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

export type TextDrawOptions = GeneralDrawOptions & {
  fontSize?: number;
  textAlign?: "left" | "right" | "center";
  verticalAlign?: "top" | "middle" | "bottom";
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

export type ShapeDetailsWithOptions = ShapeDetails & (DrawOptions | TextDrawOptions);

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
  dimensions: { width: number; height: number; };
} | undefined

export type GeneralDrawOptions = {
  color?: string;
  transparency?: number;
  rotationAngle?: number;
  rotationOrigin?: "center" | "corner";
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  offsetX?: number;
  offsetY?: number;
  showAnchor?: boolean;
  returnDetails?: boolean;
};

  // Utility to adjust position based on anchor and offsets
  function adjustForAnchorAndOffset(
    x: number,
    y: number,
    width: number,
    height: number,
    options: GeneralDrawOptions
  ): { x: number; y: number } {
    const { anchor = "top-left", offsetX = 0, offsetY = 0 } = options;
    let adjustedX = x;
    let adjustedY = y;

    switch (anchor) {
      case "top-right":
        adjustedX -= width;
        break;
      case "bottom-left":
        adjustedY -= height;
        break;
      case "bottom-right":
        adjustedX -= width;
        adjustedY -= height;
        break;
      case "center":
        adjustedX -= width / 2;
        adjustedY -= height / 2;
        break;
    }

    return { x: adjustedX + offsetX, y: adjustedY + offsetY };
  }

export type CanvasBuddy = {
  drawCircle: (x: number, y: number, radius: number, options?: DrawOptions) => ShapeDetails | undefined;
  drawSquare: (x: number, y: number, width: number, options?: DrawOptions) => ShapeDetails | undefined;
  drawText: (text: string, x: number, y: number, options?: DrawOptions) => ShapeDetails | undefined;
  markBoundingBoxLocations: (boundingBox: ShapeDetails, excludeKeys?: Array<ShapeDetails>) => void;
  eraseArea: (x: number, y: number, width: number, height: number) => void;
  clearCanvas: () => void;
  clearBoundingBox: (boundingBox: ShapeDetails) => void;
  calculateBoundingBox: (x: number, y: number, width: number, height: number, options: GeneralDrawOptions, isCircle?: boolean) => ShapeDetails | undefined 
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export function calculateBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number,
  options: GeneralDrawOptions = { returnDetails: true },
  isCircle: boolean = false
  ): ShapeDetails | undefined {
  if (!options.returnDetails) return;
  const { rotationAngle = 0, rotationOrigin = "center", anchor = "top-left" } = options;
  const radians = (rotationAngle * Math.PI) / 180;
  const centerX = rotationOrigin === "center" ? x + width / 2 : x;
  const centerY = rotationOrigin === "center" ? y + height / 2 : y;

  // Special handling for circles
  if (isCircle) {
    const radius = width / 2;
    return {
      center: { x: centerX, y: centerY },
      min: { x: centerX - radius, y: centerY - radius },
      max: { x: centerX + radius, y: centerY + radius },
      anchor: adjustForAnchorAndOffset(x, y, width, height, options),
      topLeft: { x: centerX - radius, y: centerY - radius },
      topRight: { x: centerX + radius, y: centerY - radius },
      bottomLeft: { x: centerX - radius, y: centerY + radius },
      bottomRight: { x: centerX + radius, y: centerY + radius },
      topCenter: { x: centerX, y: centerY - radius },
      bottomCenter: { x: centerX, y: centerY + radius },
      leftCenter: { x: centerX - radius, y: centerY },
      rightCenter: { x: centerX + radius, y: centerY },
      dimensions: { width: radius * 2, height: radius * 2 },
    };
  }

  const corners = [
    { x: x, y: y },
    { x: x + width, y: y },
    { x: x, y: y + height },
    { x: x + width, y: y + height },
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

  return {
    center: { x: centerX, y: centerY },
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
    anchor: adjustForAnchorAndOffset(x, y, width, height, options),
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
}

export function createCanvasBuddy(canvas: HTMLCanvasElement): CanvasBuddy {
  const ctx = canvas.getContext("2d")!;
  if (!ctx) throw new Error("Failed to get 2D context");

  const canvasState = createLazyState({ canvasDetails: ["timed", _getCanvasDetails, 1000] });

  function _calculateBoundingBox(
      x: number,
      y: number,
      width: number,
      height: number,
      options: GeneralDrawOptions = { returnDetails: true },
      isCircle: boolean = false
  ): ShapeDetails | undefined {
      applyOptions(options);
      return calculateBoundingBox(x, y, width, height, options, isCircle);
  }

  function handleRotation(
    x: number,
    y: number,
    width: number,
    height: number,
    options: GeneralDrawOptions,
    callback: () => void
  ): void {
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

  function applyOptions(options: GeneralDrawOptions = {}): void {
    ctx.fillStyle = options.color || "#000";
    ctx.globalAlpha = options.transparency !== undefined ? Math.max(0, Math.min(1, options.transparency)) : 1;
  }
  
  function applyTextOptions(options: TextDrawOptions = {}): void {
    applyOptions(options);
    ctx.font = `${options.fontSize || 16}px sans-serif`;
    ctx.textAlign = options.textAlign || "start";
  }
  
  function drawShape(
    drawFn: () => void,
    x: number,
    y: number,
    width: number,
    height: number,
    options: GeneralDrawOptions,
    isCircle: boolean = false
  ): ShapeDetails | undefined {
    const { x: adjustedX, y: adjustedY } = adjustForAnchorAndOffset(x, y, width, height, options);
    handleRotation(adjustedX, adjustedY, width, height, options, drawFn);
    if (options.showAnchor) {
      ctx.save();
      ctx.fillStyle = "limegreen";
      ctx.beginPath();
      ctx.arc(adjustedX, adjustedY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return calculateBoundingBox(adjustedX, adjustedY, width, height, options, isCircle);
  }

  function _getCanvasDetails() {
    const { width, height } = canvas;
    const rect = canvas.getBoundingClientRect();
    return {
      width,
      height,
      location: {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
      },
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
    options: GeneralDrawOptions = {}
  ): ShapeDetails | undefined {
    applyOptions(options);
    return drawShape(() => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }, x, y, radius * 2, radius * 2, options, true);
  }

  function drawSquare(
    x: number,
    y: number,
    width: number,
    options: GeneralDrawOptions = {}
  ): ShapeDetails | undefined {
    applyOptions(options);
    return drawShape(() => ctx.fillRect(x, y, width, width), x, y, width, width, options);
  }

  function drawText(
    text: string,
    x: number,
    y: number,
    options: TextDrawOptions = {}
  ): ShapeDetails | undefined {
    const fontSize = options.fontSize || 16;
    const textWidth = ctx.measureText(text).width;
    const height = fontSize; // Approximate height
    applyTextOptions(options);
    return drawShape(() => {
      const verticalOffset =
        options.verticalAlign === "middle"
          ? height / 2
          : options.verticalAlign === "bottom"
          ? height
          : 0;
      ctx.fillText(text, x, y + verticalOffset);
    }, x, y, textWidth, height, options);
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

  return {
    drawCircle,
    drawSquare,
    drawText,
    markBoundingBoxLocations,
    eraseArea,
    clearCanvas,
    clearBoundingBox,
    calculateBoundingBox,
    width: canvas.width,
    height: canvas.height,
    top: _getCanvasDetails().location.top,
    left: _getCanvasDetails().location.left,
    right: _getCanvasDetails().location.right,
    bottom: _getCanvasDetails().location.bottom,
  };
}
