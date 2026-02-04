import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/appUser';

export async function POST(request: NextRequest) {
    const supabase = createAdminClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'File type not allowed. Use JPEG, PNG, or WebP.'
            }, { status: 400 });
        }

        // Validate file size (max 2MB before compression, we'll compress client-side)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            return NextResponse.json({
                error: 'File too large. Maximum 2MB.'
            }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filename = `${user.puskesmas_id || 'admin'}/${timestamp}_${randomId}.${ext}`;

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('logistik')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('[Upload API] Storage error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('logistik')
            .getPublicUrl(data.path);

        console.log(`[Upload API] Uploaded: ${filename} -> ${publicUrl}`);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: data.path
        });

    } catch (err: any) {
        console.error('[Upload API] Error:', err);
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
    }
}
