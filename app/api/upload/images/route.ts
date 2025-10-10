import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { uploadFromBuffer, getFolderForType } from '@/lib/cloudinary';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-helpers';

// Configure API route for handling uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Configure file size limits
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '20971520'); // 20MB default
const maxFiles = 10; // Maximum number of files per request

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 Cloudinary image upload API called');
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return createErrorResponse('Authentication required', 401, 'Unauthorized');
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const uploadType = (formData.get('type') as string) || 'products';
    
    console.log(`⚡ Processing ${files.length} files for ${uploadType}`);
    
    // Validate files
    if (!files || files.length === 0) {
      return createErrorResponse('No files uploaded', 400, 'Validation Error');
    }
    
    if (files.length > maxFiles) {
      return createErrorResponse(`Too many files. Maximum ${maxFiles} files allowed`, 400, 'Validation Error');
    }

    // Upload all files to Cloudinary in parallel
    const uploadPromises = files.map(async (file, index) => {
      // Basic file validation
      if (file.size > maxFileSize) {
        throw new Error(`File ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB > ${Math.round(maxFileSize / 1024 / 1024)}MB)`);
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Upload to Cloudinary with optimized settings
      const uploadResult = await uploadFromBuffer(buffer, {
        folder: getFolderForType(uploadType),
        resourceType: 'image',
        overwrite: false,
        tags: [uploadType, 'web-upload'],
        transformation: [
          { quality: 'auto:good' }, // Automatic quality optimization
          { format: 'auto' }, // Automatic format selection (WebP, AVIF when supported)
          { fetch_format: 'auto' } // Deliver optimal format
        ]
      });

      console.log(`✅ Uploaded: ${file.name} -> ${uploadResult.public_id}`);
      return uploadResult.secure_url;
    });

    // Wait for all uploads to complete
    const uploadedImageUrls = await Promise.all(uploadPromises);
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 All ${files.length} images uploaded to Cloudinary in ${totalTime}ms`);
    
    return createSuccessResponse(
      {
        images: uploadedImageUrls,
        stats: {
          uploadedFiles: files.length,
          processingTime: totalTime,
          avgTimePerImage: Math.round(totalTime / files.length),
          provider: 'cloudinary'
        }
      },
      `Successfully uploaded ${files.length} image${files.length !== 1 ? 's' : ''} to Cloudinary`
    );

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Cloudinary upload failed after ${totalTime}ms:`, error);
    return handleApiError(error, 'POST /api/upload/images');
  }
}


// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}