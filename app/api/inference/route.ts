/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

const TRITON_URL = process.env.TRITON_URL || 'http://localhost:8000';
const MODEL_NAME = process.env.MODEL_NAME || 'your_model_name';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract parameters from frontend
    const { inputs, parameters } = body;

    // Build Triton inference request
    const tritonRequest = {
      inputs: inputs.map((input: any) => ({
        name: input.name,
        shape: input.shape,
        datatype: input.datatype,
        data: input.data
      })),
      // Optional: pass parameters to model
      parameters: parameters || {}
    };

    // Call Triton
    const response = await fetch(
      `${TRITON_URL}/v2/models/${MODEL_NAME}/infer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tritonRequest)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Triton inference failed', details: error },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Inference error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const response = await fetch(`${TRITON_URL}/v2/health/ready`);
    const isReady = response.ok;
    
    return NextResponse.json({
      status: isReady ? 'ready' : 'not ready',
      tritonUrl: TRITON_URL,
      modelName: MODEL_NAME
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}