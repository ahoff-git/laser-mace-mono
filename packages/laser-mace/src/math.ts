import { log, logLevels } from "./logging";

export function createRollingAverage(
    rollingWindowSize: number,
    maxDeltaPercent: number = 10
  ) {
    if (rollingWindowSize <= 0) {
      throw new Error("Rolling window size must be greater than 0.");
    }
  
    let values: number[] = [];
    let sum = 0;
    let weightedSum = 0;
    let weight = 0;
  
    return {
      add(value: number): void {
        // Compute the current average and dynamic max delta
        const currentAverage = values.length > 0 ? sum / values.length : 0;
        const maxDelta = currentAverage * (1 + maxDeltaPercent / 100);
      
        // Ignore the input value if it exceeds the dynamic threshold
        if (currentAverage > 0 && value > maxDelta && values.length > (rollingWindowSize/2)) {
          log(logLevels.debug, `Sorry... ${value} didn't make the cut`, ['rollingAverage', 'badValue', 'math'])
          return;
        }
      
        // Add the valid value
        values.push(value);
        sum += value;
      
        // Increase the weighting factor during initialization
        const currentWeight = Math.min(values.length, rollingWindowSize);
        weightedSum += value * currentWeight;
        weight += currentWeight;
      
        // Remove the oldest value if the rolling window exceeds its limit
        if (values.length > rollingWindowSize) {
          const removedValue = values.shift()!;
          sum -= removedValue;
      
          // Adjust the weighted sum and total weight
          weightedSum -= removedValue * rollingWindowSize;
          weight -= rollingWindowSize;
        }
      }
      ,
  
      getAverage(): number {
        // Use the weighted average during initialization, then switch to normal
        if (values.length < rollingWindowSize) {
          return weight === 0 ? 0 : weightedSum / weight;
        }
        return values.length === 0 ? 0 : sum / values.length;
      },
    };
  }
  