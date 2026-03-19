import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Admin SDK once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Admin SDK] Successfully initialized');
  } catch (err: any) {
    console.error('[Admin SDK] Initialization error:', err.message);
  }
}

const dbAdmin = admin.firestore();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      clientName, 
      clientEmail, 
      clientPhone, 
      clientId, 
      items, 
      totalMaterials, 
      aiConversationLog 
    } = body;

    if (!clientName || !clientEmail || !clientPhone) {
      return NextResponse.json({ error: 'Faltan datos de contacto' }, { status: 400 });
    }

    // 1. Backend Vendor Assignment (Secure & Stable with Admin SDK)
    let assignedVendorId = null;
    try {
      const vendorsSnap = await dbAdmin.collection('users')
        .where('role', '==', 'vendedor')
        .where('isActive', '==', true)
        .limit(10)
        .get();
        
      if (!vendorsSnap.empty) {
        const vendors = vendorsSnap.docs;
        assignedVendorId = vendors[Math.floor(Math.random() * vendors.length)].id;
      }
    } catch (err) {
      console.warn('[Leads API] Error assigning vendor:', err);
    }

    // 2. Create the Quote/Lead doc via Admin SDK (Bypasses security rules)
    const quoteData = {
      clientName,
      clientEmail,
      clientPhone,
      clientId: clientId || null,
      items: items || [],
      totalMaterials: totalMaterials || 0,
      grandTotal: totalMaterials || 0,
      status: 'sent',
      assignedVendorId,
      aiConversationLog: aiConversationLog || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'chat_ai'
    };

    const docRef = await dbAdmin.collection('quotes').add(quoteData);

    console.log(`[Leads API] Lead created successfully: ${docRef.id}`);

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      assignedVendorId 
    });
  } catch (err: any) {
    console.error('[Leads API] Error:', err);
    return NextResponse.json({ error: 'Error al procesar el lead: ' + err.message }, { status: 500 });
  }
}
