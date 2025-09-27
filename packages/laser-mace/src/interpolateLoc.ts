import { Point } from "./commonTypes";

export type Vect = 
Point & 
{
    s: number, 
    percentageComplete: number
}

// Function to calculate tangents based on speed
function calculateTangents(vects: Vect[]): Point[] {
    let tangents: Point[] = [];
    for (let i = 0; i < vects.length; i++) {
        if (i === 0) {
            // First and last points: use one-sided differences
            tangents.push({
                x: vects[i + 1].x - vects[i].x,
                y: vects[i + 1].y - vects[i].y,
            });
        } else if (i === vects.length - 1) {
            // First and last points: use one-sided differences
            tangents.push({
                x: vects[i - 1].x - vects[i].x,
                y: vects[i - 1].y - vects[i].y,
            });
        } else 
        {
            // Central points: use average of differences
            tangents.push({
                x: (vects[i + 1].x - vects[i - 1].x) / 2,
                y: (vects[i + 1].y - vects[i - 1].y) / 2,
            });
        }
        // Scale tangents by speed
        tangents[i].x *= vects[i].s;
        tangents[i].y *= vects[i].s;
    }
    return tangents;
}

// Hermite Spline interpolation function
function hermiteInterpolate(p0: Point, p1: Point, t0: Point, t1: Point, t: number): Point {
    const h00 = (2 * t**3) - (3 * t**2) + 1;        //Weight for StartPoint
    const h10 = (t**3) - (2 * t**2) + t;            //Weight for startTagent
    const h01 = (-2 * t**3) + (3 * t**2);           //Weight for EndPoint
    const h11 = (t**3) - (t**2);                    //Weight for endTangent

    // console.log(p0, p1, t0, t1, t);
    return {
        x: (h00 * p0.x) + (h10 * t0.x) + (h01 * p1.x) + (h11 * t1.x),
        y: (h00 * p0.y) + (h10 * t0.y) + (h01 * p1.y) + (h11 * t1.y),
    };
}

// Main function to get position at a certain percent completion
export function getPositionAtCompletion(vects: Vect[], completion: number): Point {
    if (completion > 100){
        completion = 99.99;
    }
    const tangents = calculateTangents(vects);
    
    // Find the section where the completion percentage falls
    let t = completion / 100;
    let sectionIndex = 0;
    for (let i = 1; i < vects.length; i++) {
        if (t < vects[i].percentageComplete / 100) {
            sectionIndex = i - 1;
            break;
        }
    }

    // Calculate local t within the section
    const sectionStart = vects[sectionIndex].percentageComplete / 100;
    const sectionEnd = vects[sectionIndex + 1].percentageComplete / 100;
    const localT = (t - sectionStart) / (sectionEnd - sectionStart);

    return hermiteInterpolate(
        vects[sectionIndex],
        vects[sectionIndex + 1],
        tangents[sectionIndex],
        tangents[sectionIndex + 1],
        localT
    );
}

