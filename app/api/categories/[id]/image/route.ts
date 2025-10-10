import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { createSuccessResponse, createErrorResponse, handleApiError, rateLimit, getClientIP } from '@/lib/api-helpers';
import { uploadFromBuffer, getFolderForType } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return createErrorResponse('Authentication required', 401, 'Unauthorized');
    }

    const clientIP = getClientIP(request);
    const rl = rateLimit(`category_image_upload_${clientIP}`, 20, 60000);
    if (!rl.allowed) {
      return createErrorResponse('Too many requests', 429, 'Rate limit exceeded');
    }

    const { id } = params;
    const category = await Category.findById(id);
    if (!category) {
      return createErrorResponse('Category not found', 404, 'Not Found');
    }

    const formData = await request.formData();
    const file = formData.get('image') as unknown as File | null;

    if (!file || typeof (file as any).arrayBuffer !== 'function') {
      return createErrorResponse('No image file provided', 400, 'Validation Error');
    }

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '20971520', 10);
    if ((file as File).size > maxSize) {
      return createErrorResponse('File too large', 400, 'Validation Error');
    }

    const buffer = Buffer.from(await (file as File).arrayBuffer());

    const uploadResult = await uploadFromBuffer(buffer, {
      folder: getFolderForType('categories'),
      resourceType: 'image',
      overwrite: true,
      tags: ['category']
    });

    const secureUrl = uploadResult.secure_url;

    // Replace category image
    category.image = secureUrl;
    await category.save();

    return createSuccessResponse(
      { url: secureUrl, categoryId: String(category._id) },
      'Image uploaded and category updated'
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/categories/[id]/image');
  }
}
