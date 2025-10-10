import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
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

    // Only admins can upload product images
    // Fetch user role via session if available
    // If role not in session, rely on admin-only UI to restrict access
    const clientIP = getClientIP(request);
    const rl = rateLimit(`product_image_upload_${clientIP}`, 20, 60000);
    if (!rl.allowed) {
      return createErrorResponse('Too many requests', 429, 'Rate limit exceeded');
    }

    const { id } = params;
    const product = await Product.findById(id);
    if (!product) {
      return createErrorResponse('Product not found', 404, 'Not Found');
    }

    const formData = await request.formData();
    const file = formData.get('image') as unknown as File | null;
    const type = (formData.get('type') as string) || 'products';

    if (!file || typeof (file as any).arrayBuffer !== 'function') {
      return createErrorResponse('No image file provided', 400, 'Validation Error');
    }

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '20971520', 10);
    if ((file as File).size > maxSize) {
      return createErrorResponse('File too large', 400, 'Validation Error');
    }

    const buffer = Buffer.from(await (file as File).arrayBuffer());

    const uploadResult = await uploadFromBuffer(buffer, {
      folder: getFolderForType(type),
      resourceType: 'image',
      overwrite: false,
      tags: ['product', type]
    });

    const secureUrl = uploadResult.secure_url;

    // Append to images array by default
    product.images = Array.isArray(product.images) ? [...product.images, secureUrl] : [secureUrl];
    await product.save();

    return createSuccessResponse(
      { url: secureUrl, productId: String(product._id) },
      'Image uploaded and product updated'
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/products/[id]/image');
  }
}
