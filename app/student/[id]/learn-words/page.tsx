"use client"

import { FormEvent, use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Volume2, Check, X, Sparkles, Trophy, Mic, Loader2, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@/lib/supabase/client"

const STEPS = [
  { label: "1. Word", state: "entry" },
  { label: "2. Question", state: "question" },
  { label: "3. Learn", state: "learning" },
  { label: "4. Review", state: "review" },
  { label: "5. Celebrate", state: "success" },
] as const

type Step = (typeof STEPS)[number]["state"]

type WordDetails = {
  word: string
  pronunciation: string
  definition: string
  simpleDefinition: string
  example: string
  memoryTip: string
  relatedWords: string[]
  difficulty: string
  audioUrl?: string | null
  alreadyMastered?: boolean
  timesReviewed?: number
}

type SpeechRecognitionInstance = {
  start: () => void
  stop: () => void
  abort: () => void
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onaudioend?: () => void
  onresult?: (event: any) => void
  onerror?: (event: any) => void
  onend?: () => void
}

const getPronunciationParts = (value: string) => {
  const cleaned = value.replace(/\s+/g, " ").trim()

  if (!cleaned) {
    return { spelled: "", spoken: "" }
  }

  const segments = cleaned.split(" ").filter(Boolean)
  const isLetterChain = segments.length > 0 && segments.every((segment) => segment.length === 1)
  const spoken = isLetterChain ? segments.join("") : cleaned

  const spelled = segments
    .map((segment) => segment.split("").join(" "))
    .join("   ")

  return { spelled, spoken }
}

export default function LearnWordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [activeTab, setActiveTab] = useState<"pronounce" | "learn">("pronounce")
  const [step, setStep] = useState<Step>("entry")
  const [inputWord, setInputWord] = useState("")
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null)
  const [wordsLearnedCount, setWordsLearnedCount] = useState<number>(0)
  const [isFetchingWord, setIsFetchingWord] = useState(false)
  const [isProcessingOutcome, setIsProcessingOutcome] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [pronounceWord, setPronounceWord] = useState("")
  const [pronunciationError, setPronunciationError] = useState<string | null>(null)
  const [pronunciationSuccess, setPronunciationSuccess] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    void refreshWordsLearnedCount()

    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const refreshWordsLearnedCount = async () => {
    try {
      const supabase = createBrowserClient()
      const { count, error } = await supabase
        .from("words_learned")
        .select("id", { count: "exact", head: true })
        .eq("student_id", id)
        .eq("mastered", true)

      if (error) {
        console.error("[v0] Failed to load words learned count:", error)
        return
      }

      if (typeof count === "number") {
        setWordsLearnedCount(count)
      }
    } catch (error) {
      console.error("[v0] Unexpected error loading word stats:", error)
    }
  }

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault()

    if (isFetchingWord) return

    const trimmed = inputWord.trim()

    if (!trimmed) {
      setErrorMessage("Type a word or use the microphone first.")
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)
    setIsFetchingWord(true)

    try {
      const response = await fetch("/api/learn-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: trimmed, studentId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error ?? "We couldn't look up that word. Try another one.")
        return
      }

      const details: WordDetails = data.wordDetails
      setWordDetails(details)
      setInputWord(details.word)

      if (details.alreadyMastered) {
        setInfoMessage("Great choice! You're reviewing a word you've already mastered.")
      } else {
        setInfoMessage(null)
      }

      setStep("question")
    } catch (error) {
      console.error("[v0] Failed to load word details:", error)
      setErrorMessage("We hit a snag while contacting the dictionary. Please try again.")
    } finally {
      setIsFetchingWord(false)
    }
  }

  const handleOutcome = async (outcome: "mastered" | "needs_review") => {
    if (!wordDetails || isProcessingOutcome) return

    setIsProcessingOutcome(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/learn-word", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: wordDetails.word, studentId: id, outcome }),
      })

      if (!response.ok) {
        const data = await response.json()
        setErrorMessage(data.error ?? "We couldn't save your progress. Please try again.")
        return
      }

      if (outcome === "mastered") {
        if (!wordDetails.alreadyMastered) {
          setWordsLearnedCount((current) => current + 1)
          setWordDetails({ ...wordDetails, alreadyMastered: true })
        }

        setShowCelebration(true)
        celebrationTimeoutRef.current = setTimeout(() => {
          setStep("success")
          setShowCelebration(false)
        }, 1500)
      } else {
        setStep("review")
      }
    } catch (error) {
      console.error("[v0] Failed to update word outcome:", error)
      setErrorMessage("We couldn't save that choice. Please try again.")
    } finally {
      setIsProcessingOutcome(false)
    }
  }

  const handlePlayAudio = (audioUrl?: string | null) => {
    if (!audioUrl) {
      speakText(wordDetails?.word ?? "")
      return
    }

    const audio = new Audio(audioUrl)
    audio.play().catch(() => {
      speakText(wordDetails?.word ?? "")
    })
  }

  // Moe's voice: male, slower
  const speakText = (text: string) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7; // slower
    utterance.pitch = 1;
    // Try to select a male voice
    const voices = synth.getVoices();
    const male = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("male"))
      || voices.find(v => v.lang.startsWith("en") && v.gender === "male")
      || voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("david"))
      || voices.find(v => v.lang.startsWith("en"));
    if (male) utterance.voice = male;
    synth.speak(utterance);
    return true;
  }

  const speakSpelling = (rawWord: string) => {
    if (!rawWord || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false
    }

    const { spelled, spoken } = getPronunciationParts(rawWord)

    if (!spoken) {
      return false
    }

    const synth = window.speechSynthesis
    synth.cancel()

    if (spelled) {
      const spelledUtterance = new SpeechSynthesisUtterance(spelled.toUpperCase())
      spelledUtterance.lang = "en-US"
      spelledUtterance.rate = 0.85
      spelledUtterance.pitch = 1
      synth.speak(spelledUtterance)
    }

    const wordUtterance = new SpeechSynthesisUtterance(spoken)
    wordUtterance.lang = "en-US"
    wordUtterance.rate = 0.95
    wordUtterance.pitch = 1
    synth.speak(wordUtterance)

    return true
  }

  const logPronunciation = async (word: string) => {
    const normalized = word.replace(/\s+/g, " ").trim()

    if (!normalized) {
      return
    }

    try {
      await fetch("/api/word-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: normalized, studentId: id }),
      })
    } catch (error) {
      console.error("[v0] Failed to log pronunciation:", error)
    }
  }

  const startListening = (target: "learn" | "pronounce") => {
    if (target === "learn") {
      setErrorMessage(null)
    } else {
      setPronunciationError(null)
      setPronunciationSuccess(null)
    }

    if (typeof window === "undefined") {
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      if (target === "learn") {
        setErrorMessage("Your browser doesn't support speech-to-text. Try typing the word instead.")
      } else {
        setPronunciationError("Your browser doesn't support speech-to-text. Try typing the word instead.")
      }
      return
    }

    const recognition: SpeechRecognitionInstance = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript as string | undefined
      if (transcript) {
        const value = transcript.toLowerCase()
        if (target === "learn") {
          setInputWord(value)
        } else {
          setPronounceWord(value)
          setPronunciationError(null)
          setPronunciationSuccess(null)
        }
      }
      setIsListening(false)
    }

    recognition.onerror = () => {
      if (target === "learn") {
        setErrorMessage("We couldn't hear clearly. Please try again or type the word.")
      } else {
        setPronunciationError("We couldn't hear clearly. Please try again or type the word.")
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current?.abort()
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const handlePronounce = () => {
    const trimmed = pronounceWord.trim()

    if (!trimmed) {
      setPronunciationError("Type a word or use the microphone first.")
      setPronunciationSuccess(null)
      return
    }

    const didSpeak = speakSpelling(trimmed)

    if (!didSpeak) {
      setPronunciationError("We couldn't play the pronunciation. Try a different browser or device.")
      setPronunciationSuccess(null)
      return
    }

    setPronunciationError(null)
    const { spelled: spelledDisplay, spoken: spokenWord } = getPronunciationParts(trimmed)
    const displaySpelling = spelledDisplay || spokenWord
    setPronunciationSuccess(`Moe is saying "${displaySpelling}${spokenWord ? ` - ${spokenWord}` : ""}". Listen and repeat!`)

    if (spokenWord) {
      void logPronunciation(spokenWord)
    }
  }

  const resetToEntry = () => {
    setStep("entry")
    setWordDetails(null)
    setInputWord("")
    setInfoMessage(null)
    setErrorMessage(null)
  }

  const PronunciationView = () => {
    const { spelled: spelledDisplay, spoken: spokenWord } = getPronunciationParts(pronounceWord)

    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="border-4 border-purple-200 shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Practice pronunciation</CardTitle>
            <CardDescription className="text-base">
              Type a word, say it out loud, and Moe will pronounce it back to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {spokenWord ? (
              <div className="rounded-xl border-2 border-purple-100 bg-purple-50 p-4 text-center">
                <p className="text-sm font-semibold text-purple-700">Say it like</p>
                <p className="mt-2 text-2xl font-bold text-purple-900">
                  {(spelledDisplay || spokenWord) + (spokenWord ? ` - ${spokenWord}` : "")}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="flex-1 rounded-xl border-2 border-purple-200 bg-white px-4 py-3 text-lg shadow-sm focus:border-purple-500 focus:outline-none"
                placeholder="Enter a word (e.g. courageous)"
                value={pronounceWord}
                onChange={(event) => {
                  setPronounceWord(event.target.value)
                  setPronunciationError(null)
                  setPronunciationSuccess(null)
                }}
                aria-label="Word to pronounce"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "secondary"}
                  className="h-12 w-12 flex-shrink-0"
                  onClick={() => (isListening ? stopListening() : startListening("pronounce"))}
                >
                  {isListening ? <X className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  <span className="sr-only">{isListening ? "Stop listening" : "Start speech to text"}</span>
                </Button>
                <Button type="button" className="h-12 flex-shrink-0 font-semibold" onClick={handlePronounce}>
                  Hear it
                </Button>
              </div>
            </div>

            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-semibold">Pronunciation tip</p>
              <p>Press "Hear it" and then repeat after Moe three times to lock it in.</p>
            </div>

            {pronunciationError ? (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-red-700">{pronunciationError}</div>
            ) : null}

            {pronunciationSuccess ? (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3 text-green-700">{pronunciationSuccess}</div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    )
  }

  const QuestionView = () => (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="border-4 border-blue-200 shadow-xl">
        <CardContent className="space-y-6 pt-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
              🤖
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">You asked Moe:</h3>
            <p className="text-2xl font-bold text-blue-600">"What does {wordDetails?.word} mean?"</p>
          </div>

          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <span className="flex gap-2">
              <span className="h-3 w-3 animate-bounce rounded-full bg-blue-600" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:0.1s]" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:0.2s]" />
            </span>
            Moe is thinking...
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-12 font-semibold"
              onClick={resetToEntry}
              type="button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Choose another word
            </Button>
            <Button className="h-12 font-semibold" onClick={() => setStep("learning")} type="button">
              See Moe&apos;s answer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const LearningView = () => (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-yellow-300 bg-yellow-100 p-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-600" />
          <p className="font-semibold text-gray-800">
            Words mastered: <span className="text-yellow-800">{wordsLearnedCount}</span>
          </p>
        </div>
        <Badge variant="secondary" className="bg-white text-yellow-700">
          Difficulty: {wordDetails?.difficulty}
        </Badge>
      </div>

      <Card className="border-4 border-blue-300 bg-gradient-to-br from-blue-50 to-green-50 shadow-2xl">
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center gap-3 border-b-2 border-blue-200 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-2xl">🤖</div>
            <div>
              <p className="text-lg font-bold text-blue-700">Moe</p>
              <p className="text-sm text-gray-600">Your AI teacher</p>
            </div>
          </div>

          <div className="text-center">
            <h1 className="mb-4 text-5xl font-bold text-gray-900 capitalize">{wordDetails?.word}</h1>
            <Button
              type="button"
              onClick={() => handlePlayAudio(wordDetails?.audioUrl)}
              className="mx-auto flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-600"
            >
              <Volume2 className="h-5 w-5" />
              {wordDetails?.pronunciation}
            </Button>
          </div>

          <div className="rounded-2xl border-2 border-green-200 bg-white p-6 shadow-md">
            <div className="mb-2 flex items-start gap-3">
              <div className="text-2xl">📖</div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-bold text-gray-800">In simple words:</h3>
                <p className="text-xl leading-relaxed text-gray-700">{wordDetails?.simpleDefinition}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 h-auto gap-2 p-0 text-sm font-medium text-blue-600"
              onClick={() => speakText(wordDetails?.simpleDefinition ?? "")}
            >
              <Volume2 className="h-4 w-4" /> Listen again
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="border-2 border-purple-200">
              <CardContent className="flex items-start gap-3 pt-6">
                <div className="text-2xl">💡</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="mb-2 text-lg font-bold text-gray-800">More detail:</h3>
                    <Button size="icon" variant="ghost" onClick={() => speakText(wordDetails?.definition ?? "")}>🔊</Button>
                  </div>
                  <p className="leading-relaxed text-gray-700">{wordDetails?.definition}</p>
                </div>
              </CardContent>
            </Card>

            {wordDetails?.example ? (
              <Card className="border-2 border-orange-200">
                <CardContent className="flex items-start gap-3 pt-6">
                  <div className="text-2xl">📝</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="mb-2 text-lg font-bold text-gray-800">Example sentence:</h3>
                      <Button size="icon" variant="ghost" onClick={() => speakText(wordDetails?.example ?? "")}>🔊</Button>
                    </div>
                    <p className="italic leading-relaxed text-gray-700">“{wordDetails.example}”</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-2 border-yellow-300 bg-yellow-50">
              <CardContent className="flex items-start gap-3 pt-6">
                <div className="text-2xl">🧠</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="mb-2 text-lg font-bold text-gray-800">Memory trick:</h3>
                    <Button size="icon" variant="ghost" onClick={() => speakText(wordDetails?.memoryTip ?? "")}>🔊</Button>
                  </div>
                  <p className="leading-relaxed text-gray-700">{wordDetails?.memoryTip}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="mb-3 font-bold text-gray-800">Words that go together:</h3>
              <Button size="icon" variant="ghost" onClick={() => speakText((wordDetails?.relatedWords || []).join(", "))}>🔊</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {wordDetails?.relatedWords.map((word) => (
                <span key={word} className="rounded-full border-2 border-blue-200 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-14 gap-2 font-bold"
              onClick={() => handleOutcome("needs_review")}
              type="button"
              disabled={isProcessingOutcome}
            >
              {isProcessingOutcome ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-5 w-5" />}
              Not clear yet
            </Button>
            <Button
              className="h-14 gap-2 font-bold"
              onClick={() => handleOutcome("mastered")}
              type="button"
              disabled={isProcessingOutcome}
            >
              {isProcessingOutcome ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
              I understand!
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 border-2 border-blue-200 bg-blue-50">
        <CardContent className="py-4 text-center text-sm text-gray-700">
          💡 <strong>Pro tip:</strong> Use the word in a sentence with your family tonight to help it stick!
        </CardContent>
      </Card>
    </div>
  )

  const ReviewView = () => (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="border-4 border-orange-300 shadow-xl">
        <CardContent className="space-y-6 pt-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl">
              🤖
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-800">No worries! Let’s break it down.</h3>
            <p className="text-gray-600">Read these steps slowly with Moe.</p>
          </div>

          <div className="space-y-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
            {["Say the word out loud with Moe.", "Clap the parts of the word together.", "Use it in a sentence about school or home."].map((tip, index) => (
              <div key={tip} className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>

          <Button className="h-12 font-semibold" onClick={() => void handleOutcome("mastered")}>Now I get it!</Button>
          <Button variant="ghost" className="h-12 font-semibold" onClick={() => setStep("learning")}>Go back to the explanation</Button>
        </CardContent>
      </Card>
    </div>
  )

  const SuccessView = () => (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="border-0 bg-gradient-to-br from-green-400 to-blue-500 text-white shadow-2xl">
        <CardContent className="space-y-6 pt-6 text-center">
          <div className="text-8xl animate-bounce">🎉</div>
          <h2 className="text-4xl font-bold">Awesome job!</h2>
          <p className="text-2xl">You mastered “{wordDetails?.word}”.</p>

          <div className="mx-auto w-fit rounded-2xl bg-white/20 px-10 py-6 backdrop-blur">
            <p className="text-5xl font-bold">{wordsLearnedCount}</p>
            <p className="text-lg">Words mastered so far</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="secondary"
              className="h-12 font-semibold text-blue-600"
              onClick={resetToEntry}
            >
              Learn another word
            </Button>
            <Button
              variant="secondary"
              className="h-12 font-semibold text-blue-600"
              asChild
            >
              <Link href={`/student/${id}`}>
                <Home className="mr-2 h-4 w-4" /> Back to home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 border-2 border-yellow-300 bg-yellow-50">
        <CardContent className="py-4 text-center text-gray-700">
          <strong>🔔 We’ll let your parent know:</strong> “{wordDetails?.word}” is now in your word bank!
        </CardContent>
      </Card>
    </div>
  )

  const EntryView = () => (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="border-4 border-blue-200 shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">Learn a new word</CardTitle>
          <CardDescription className="text-base">
            Type a word or press the microphone. Moe will teach you what it means.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="flex-1 rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-lg shadow-sm focus:border-blue-500 focus:outline-none"
                placeholder="Enter a word (e.g. gratitude)"
                value={inputWord}
                onChange={(event) => setInputWord(event.target.value)}
                aria-label="Word to learn"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "secondary"}
                  className="h-12 w-12 flex-shrink-0"
                  onClick={() => (isListening ? stopListening() : startListening("learn"))}
                >
                  {isListening ? <X className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  <span className="sr-only">{isListening ? "Stop listening" : "Start speech to text"}</span>
                </Button>
                <Button type="submit" className="h-12 flex-shrink-0 font-semibold" disabled={isFetchingWord}>
                  {isFetchingWord ? <Loader2 className="h-5 w-5 animate-spin" /> : "Teach me"}
                </Button>
              </div>
            </div>
          </form>

          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">Progress tip</p>
            <p>Keep practicing! You’ve mastered {wordsLearnedCount} word{wordsLearnedCount === 1 ? "" : "s"} so far.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const CelebrationOverlay = showCelebration ? (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Sparkles className="h-32 w-32 animate-ping text-yellow-300" />
    </div>
  ) : null

  const handleTabChange = (value: string) => {
    const nextTab = value === "pronounce" ? "pronounce" : "learn"
    setActiveTab(nextTab)

    if (nextTab === "pronounce") {
      setPronunciationError(null)
      setPronunciationSuccess(null)
    } else {
      setErrorMessage(null)
      setInfoMessage(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50 py-8">
      {CelebrationOverlay}

      <div className="mx-auto max-w-4xl px-6 pb-12">
        <Button variant="ghost" className="mb-4 w-fit gap-2" asChild>
          <Link href={`/student/${id}`}>
            <ArrowLeft className="h-4 w-4" /> Back to activities
          </Link>
        </Button>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white p-1">
            <TabsTrigger value="pronounce">Pronounce</TabsTrigger>
            <TabsTrigger value="learn">Learn & Master</TabsTrigger>
          </TabsList>

          <TabsContent value="pronounce">
            <PronunciationView />
          </TabsContent>

          <TabsContent value="learn" className="space-y-6">
            <div className="overflow-x-auto rounded-xl bg-white p-3 shadow-md">
              <div className="flex gap-2">
                {STEPS.map(({ label, state }) => (
                  <button
                    key={state}
                    type="button"
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      step === state ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => {
                      if (state === "entry") {
                        resetToEntry()
                      } else if (wordDetails) {
                        setStep(state as Step)
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage ? (
              <div className="mx-auto max-w-2xl rounded-xl border-2 border-red-200 bg-red-50 px-6 py-4 text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {infoMessage ? (
              <div className="mx-auto max-w-2xl rounded-xl border-2 border-blue-200 bg-blue-50 px-6 py-4 text-blue-700">
                {infoMessage}
              </div>
            ) : null}

            {step === "entry" && <EntryView />}
            {step === "question" && wordDetails && <QuestionView />}
            {step === "learning" && wordDetails && <LearningView />}
            {step === "review" && wordDetails && <ReviewView />}
            {step === "success" && wordDetails && <SuccessView />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
