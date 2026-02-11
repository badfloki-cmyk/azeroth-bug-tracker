import { NextResponse } from 'next/server';
import { connectDB } from 'lib/db/mongodb';
import FeatureRequest from 'lib/models/FeatureRequest';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const feature = await FeatureRequest.findById(id);

        if (!feature) {
            return NextResponse.json({ error: 'Feature request not found' }, { status: 404 });
        }

        return NextResponse.json(feature);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch feature request', details: error.message }, { status: 500 });
    }
}
