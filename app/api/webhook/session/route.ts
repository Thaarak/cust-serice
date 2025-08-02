import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json()

    // Here you would typically save to Supabase
    // const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
    // await supabase.from('sessions').insert(sessionData)

    console.log("Received session data:", sessionData)

    return NextResponse.json({
      success: true,
      message: "Session data received successfully",
      sessionId: sessionData.sessionId,
    })
  } catch (error) {
    console.error("Error processing session data:", error)
    return NextResponse.json({ success: false, error: "Failed to process session data" }, { status: 500 })
  }
}
