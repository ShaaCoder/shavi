import Image from 'next/image';

export default function TestCloudinaryPage() {
  // Test with a sample Cloudinary URL from your domain
  const testImageUrl = 'https://res.cloudinary.com/dju051td9/image/upload/v1760090422/shavistore/products/qmwb3dqg40y9db9pok41.jpg';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cloudinary Image Test</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Next.js Image Component:</h2>
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <Image
              src={testImageUrl}
              alt="Test Cloudinary Image"
              width={300}
              height={300}
              className="rounded-lg"
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Direct img tag:</h2>
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <img
              src={testImageUrl}
              alt="Direct Cloudinary Image"
              className="w-[300px] h-[300px] object-cover rounded-lg"
            />
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-800">Check Browser Console</h3>
          <p className="text-sm text-gray-600 mt-1">
            If you see CORS errors, the fix may need additional adjustments.
            The images should load without any console errors.
          </p>
        </div>
      </div>
    </div>
  );
}