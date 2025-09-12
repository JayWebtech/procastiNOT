import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    const evidenceUrl = formData.get('evidenceUrl') as string;

    if (!file && !evidenceUrl) {
      return NextResponse.json({ error: 'No file or evidence URL provided' }, { status: 400 });
    }

    // Create the metadata object
    const metadata = {
      name: file?.name || 'proof-submission',
      description: description || '',
      evidenceUrl: evidenceUrl || '',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    // Prepare the data to upload to IPFS
    let uploadData;
    let fileName;

    if (file) {
      // If file is provided, upload the file
      uploadData = file;
      fileName = file.name;
    } else {
      // If only evidence URL is provided, create a JSON file with the metadata
      uploadData = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      fileName = `proof-${Date.now()}.json`;
    }

    // Upload to Pinata IPFS
    const pinataFormData = new FormData();
    pinataFormData.append('file', uploadData, fileName);
    
    // Add metadata
    pinataFormData.append('pinataMetadata', JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'proof-submission',
        timestamp: metadata.timestamp
      }
    }));

    // Add options
    pinataFormData.append('pinataOptions', JSON.stringify({
      cidVersion: 1
    }));

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PRIVATE_PINATA_CLOUD_JWT}`
      },
      body: pinataFormData
    });

    if (!pinataResponse.ok) {
      const errorData = await pinataResponse.text();
      console.error('Pinata upload error:', errorData);
      return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 500 });
    }

    const pinataData = await pinataResponse.json();
    const ipfsHash = pinataData.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    // Return the actual file hash and URL, not metadata
    return NextResponse.json({
      success: true,
      ipfsHash: ipfsHash,
      ipfsUrl: ipfsUrl,
      fileHash: ipfsHash,
      fileUrl: ipfsUrl
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
