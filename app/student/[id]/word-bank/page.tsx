"use client"

import * as React from "react";
import { use, useCallback, useEffect, useMemo, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookMarked, CheckCircle2, Clock, History, Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"

interface WordEntry {
  word: string
  mastered: boolean
  times_reviewed: number | null
  definition: string | null
  last_reviewed_at: string | null
  pronunciation?: string | null
  example_sentence?: string | null
}

interface SessionEntry {
  word: string
  status: string
  created_at: string
  payload: Record<string, unknown> | null
}

type PracticeFeedback = {
  type: "success" | "error" | "info"
  message: string
}

export default function WordBankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [words, setWords] = useState<WordEntry[]>([])
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mainTab, setMainTab] = useState<'practice' | 'words'>('practice')
  const [wordsTab, setWordsTab] = useState<'all' | 'mastered' | 'review'>('all')

  const loadWordBank = useCallback(async () => {
    try {
      const supabase = createBrowserClient()

      const { data: wordRows, error: wordsError } = await supabase
        .from("words_learned")
        .select("word, mastered, times_reviewed, definition, example_sentence, pronunciation, last_reviewed_at")
        .eq("student_id", id)
        .order("last_reviewed_at", { ascending: false, nullsLast: false })

      if (wordsError) {
        console.warn("[v0] Failed to load word bank:", wordsError)
      } else {
        setWords(wordRows ?? [])
      }

      const { data: sessionRows, error: sessionsError } = await supabase
        .from("word_learning_sessions")
        .select("word, status, created_at, payload")
        .eq("student_id", id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (sessionsError && sessionsError.code !== "42P01") {
        console.warn("[v0] Failed to load word sessions:", sessionsError)
      } else {
        setSessions(sessionRows ?? [])
      }
    } catch (error) {
      console.warn("[v0] Unexpected word bank error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    const storedId = localStorage.getItem("studentId")
    if (!storedId || storedId !== id) {
      router.push("/student-login")
      return
    }

    void loadWordBank()
  }, [id, loadWordBank, router])

  const masteredCount = words.filter((word) => word.mastered).length
  const reviewCount = words.length - masteredCount

  const filteredWords = words.filter((word) => {
    if (wordsTab === "mastered") {
      return word.mastered
    }
    if (wordsTab === "review") {
      return !word.mastered
    }
    return true
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <p className="text-lg font-semibold text-primary">Loading word bank...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 py-10">
      <div className="mx-auto w-full max-w-4xl px-6">
        <Button variant="ghost" className="mb-4 w-fit gap-2" asChild>
          <Link href={`/student/${id}`}>
            <ArrowLeft className="h-4 w-4" /> Back to activities
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary">Your Word Bank</h1>
          <p className="text-muted-foreground">
            Every word you practice with Moe shows up here. Master words to earn badges and make your family proud!
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-2 border-primary/20 bg-white">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-xs font-semibold uppercase text-primary/70">Total words</p>
                <p className="text-3xl font-bold text-primary">{words.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BookMarked className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 bg-white">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-700">Mastered</p>
                <p className="text-3xl font-bold text-emerald-600">{masteredCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 bg-white">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-xs font-semibold uppercase text-amber-700">Still practicing</p>
                <p className="text-3xl font-bold text-amber-600">{reviewCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={mainTab} onValueChange={(value) => setMainTab(value as typeof mainTab)} className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="practice">Practice Missions</TabsTrigger>
            <TabsTrigger value="words">All Words</TabsTrigger>
          </TabsList>

          <TabsContent value="practice">
            <PracticeMissions studentId={id} words={words} refreshWordBank={loadWordBank} />
          </TabsContent>

          <TabsContent value="words">
            <Tabs value={wordsTab} onValueChange={(value) => setWordsTab(value as typeof wordsTab)} className="space-y-2">
              <TabsList className="bg-white">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="mastered">Mastered</TabsTrigger>
                <TabsTrigger value="review">Need Practice</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <WordGrid words={filteredWords} emptyMessage="You haven't added any words yet. Tap Hear It to start building your word bank." />
              </TabsContent>
              <TabsContent value="mastered">
                <WordGrid words={filteredWords} emptyMessage="Master a word to see it shine here." />
              </TabsContent>
              <TabsContent value="review">
                <WordGrid words={filteredWords} emptyMessage="Words you're practicing will appear here." />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 border-2 border-primary/20 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <History className="h-5 w-5" /> Recent activity
            </CardTitle>
            <CardDescription>Quick peek at your most recent word practice with Moe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity logged yet. Tap Hear It or Learn a word to get started!</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={`${session.word}-${session.created_at}`}
                  className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-primary">{session.word}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatStatus(session.status)} • {formatRelativeTime(session.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {session.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PracticeMissions({
  studentId,
  words,
  refreshWordBank,
}: {
  studentId: string
  words: WordEntry[]
  refreshWordBank: () => Promise<void>
}) {
  // --- Microphone state for Spell It Out ---
  const [isSpellListening, setIsSpellListening] = useState(false);
  const [isPronounceListening, setIsPronounceListening] = useState(false);
  const spellRecognitionRef = useRef<any>(null);
  const pronounceRecognitionRef = useRef<any>(null);

  const [activePracticeTab, setActivePracticeTab] = useState<"spell" | "identify" | "pronounce">("spell")
  const [spellTarget, setSpellTarget] = useState<WordEntry | null>(null)
  const [spellInput, setSpellInput] = useState("")
  const [spellFeedback, setSpellFeedback] = useState<PracticeFeedback | null>(null)
  const [identifyOptions, setIdentifyOptions] = useState<string[]>([])
  const [identifyTarget, setIdentifyTarget] = useState<string | null>(null)
  const [identifyFeedback, setIdentifyFeedback] = useState<PracticeFeedback | null>(null)
  const [pronounceTarget, setPronounceTarget] = useState<WordEntry | null>(null)
  const [pronounceFeedback, setPronounceFeedback] = useState<PracticeFeedback | null>(null)
  const [isLogging, setIsLogging] = useState(false)
  const [pronounceRevealed, setPronounceRevealed] = useState(false)

  const practicePool = useMemo(() => {
    if (words.length === 0) return []
    const active = words.filter((entry) => !entry.mastered)
    return active.length > 0 ? active : words
  }, [words])

  // Helper: Moe speaks a message
  const speakMoe = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    synth.speak(utterance);
  }, []);

  const speakWord = useCallback((word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return
    }

    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = "en-US"
    utterance.rate = 0.9
    utterance.pitch = 1
    synth.speak(utterance)
  }, [])

  const spellOutWord = useCallback((word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return
    }

    const synth = window.speechSynthesis
    synth.cancel()
    const letters = word.split("").join(" ")
    const letterUtterance = new SpeechSynthesisUtterance(letters)
    letterUtterance.lang = "en-US"
    letterUtterance.rate = 0.75
    letterUtterance.pitch = 1
    synth.speak(letterUtterance)

    const wordUtterance = new SpeechSynthesisUtterance(word)
    wordUtterance.lang = "en-US"
    wordUtterance.rate = 0.9
    wordUtterance.pitch = 1
    synth.speak(wordUtterance)
  }, [])

  const shuffleWords = useCallback((items: string[]) => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = copy[i]
      copy[i] = copy[j]
      copy[j] = temp
    }
    return copy
  }, [])

  const pickPracticeWord = useCallback(() => {
    if (practicePool.length === 0) {
      return null
    }
    const index = Math.floor(Math.random() * practicePool.length)
    return practicePool[index]
  }, [practicePool])

  const logWordActivity = useCallback(
    async (
      word: string,
      activityStatus: string,
      options?: { markMastered?: boolean; payload?: Record<string, unknown> },
    ) => {
      if (!word) {
        return false
      }

      try {
        setIsLogging(true)
        const response = await fetch("/api/word-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word,
            studentId,
            status: activityStatus,
            markMastered: options?.markMastered ?? false,
            payload: {
              source: "word_bank_practice",
              activity: activityStatus,
              ...(options?.payload ?? {}),
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`Practice log failed: ${response.status}`)
        }

        await refreshWordBank()
        return true
      } catch (error) {
        console.error("[v0] Practice logging failed:", error)
        return false
      } finally {
        setIsLogging(false)
      }
    },
    [refreshWordBank, studentId],
  )

  const startSpellChallenge = useCallback(() => {
    const target = pickPracticeWord()
    if (!target) {
      setSpellTarget(null)
      setSpellFeedback({ type: "info", message: "Add words to your bank to unlock spelling practice." })
      return
    }

    setSpellTarget(target)
    setSpellInput("")
    setSpellFeedback({ type: "info", message: "Listen closely. Moe will say the word once." })
    speakWord(target.word)
  }, [pickPracticeWord, speakWord])

  // Microphone for Spell It Out
  const startSpellListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpellFeedback({ type: "error", message: "Speech recognition not supported in this browser." });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript as string | undefined;
      if (transcript) {
        setSpellInput(transcript);
        setSpellFeedback(null);
      }
      setIsSpellListening(false);
    };
    recognition.onerror = () => {
      setSpellFeedback({ type: "error", message: "We couldn't hear clearly. Try again or type the word." });
      setIsSpellListening(false);
    };
    recognition.onend = () => setIsSpellListening(false);
    spellRecognitionRef.current?.abort?.();
    spellRecognitionRef.current = recognition;
    recognition.start();
    setIsSpellListening(true);
  };
  const stopSpellListening = () => {
    spellRecognitionRef.current?.stop?.();
    setIsSpellListening(false);
  };

  // Microphone for Say It Loud
  const startPronounceListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPronounceFeedback({ type: "error", message: "Speech recognition not supported in this browser." });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript as string | undefined;
      if (transcript && pronounceTarget) {
        // Compare transcript to target word
        const userSaid = transcript.trim().toLowerCase();
        const correct = pronounceTarget.word.trim().toLowerCase();
        if (userSaid === correct) {
          setPronounceFeedback({ type: "success", message: `Correct! You said ${pronounceTarget.word}.` });
          speakMoe(`Correct! You said ${pronounceTarget.word}.`);
        } else {
          setPronounceFeedback({ type: "error", message: `Try again! Moe heard: ${transcript}` });
          speakMoe("Try again! That's not quite right.");
        }
      }
      setIsPronounceListening(false);
    };
    recognition.onerror = () => {
      setPronounceFeedback({ type: "error", message: "We couldn't hear clearly. Try again or say the word." });
      speakMoe("Try again! I couldn't hear you.");
      setIsPronounceListening(false);
    };
    recognition.onend = () => setIsPronounceListening(false);
    pronounceRecognitionRef.current?.abort?.();
    pronounceRecognitionRef.current = recognition;
    recognition.start();
    setIsPronounceListening(true);
  };
  const stopPronounceListening = () => {
    pronounceRecognitionRef.current?.stop?.();
    setIsPronounceListening(false);
  };

  const submitSpelling = useCallback(async () => {
    if (!spellTarget) {
      setSpellFeedback({ type: "info", message: "Start a challenge first." })
      return
    }

    const attempt = spellInput.trim().toLowerCase()
    if (!attempt) {
      setSpellFeedback({ type: "error", message: "Type the word before you check." })
      return
    }

    if (attempt === spellTarget.word.toLowerCase()) {
      const ok = await logWordActivity(spellTarget.word, "spell_mastered", {
        markMastered: true,
        payload: { letters: spellTarget.word.length },
      })
      if (ok) {
        setSpellFeedback({ type: "success", message: `${spellTarget.word} is mastered! Great spelling.` })
        speakMoe(`Correct! You spelled ${spellTarget.word}.`);
        setSpellTarget(null)
        setSpellInput("")
      } else {
        setSpellFeedback({ type: "error", message: "Couldn't save your score. Try once more." })
        speakMoe("Sorry, couldn't save your score. Try again.");
      }
    } else {
      setSpellFeedback({ type: "error", message: "Not quite. Listen again and try spelling it slowly." })
      speakMoe("Try again! That's not quite right.");
    }
  }, [logWordActivity, spellInput, spellTarget])

  const startIdentifyRound = useCallback(() => {
    const distinctWords = Array.from(new Set(words.map((entry) => entry.word)))

    if (distinctWords.length < 2) {
      setIdentifyOptions([])
      setIdentifyTarget(null)
      setIdentifyFeedback({ type: "info", message: "You need at least two words to play this game." })
      return
    }

    const pool = shuffleWords(distinctWords)
    const options = pool.slice(0, Math.min(4, pool.length))
    const target = options[Math.floor(Math.random() * options.length)]

    setIdentifyOptions(options)
    setIdentifyTarget(target)
    setIdentifyFeedback({ type: "info", message: "Tap the word Moe calls out." })
    speakWord(target)
  }, [shuffleWords, speakWord, words])

  const pickIdentifyOption = useCallback(
    async (word: string) => {
      if (!identifyTarget) {
        return
      }

      if (word === identifyTarget) {
        const ok = await logWordActivity(word, "identify_correct", {
          payload: { choices: identifyOptions },
        })
        if (ok) {
          setIdentifyFeedback({ type: "success", message: `Yes! That was ${word}.` })
        } else {
          setIdentifyFeedback({ type: "error", message: "Hmm, we couldn't log that. Try again." })
        }
      } else {
        setIdentifyFeedback({ type: "error", message: "Try again. Listen once more and choose carefully." })
      }
    },
    [identifyOptions, identifyTarget, logWordActivity],
  )

  const startPronounceRound = useCallback(() => {
    const target = pickPracticeWord()
    if (!target) {
      setPronounceTarget(null)
      setPronounceFeedback({ type: "info", message: "Add more words first to unlock this mission." })
      return
    }

    setPronounceTarget(target)
    setPronounceRevealed(false)
    setPronounceFeedback({ type: "info", message: "Hear the letters, then say the word out loud." })
    spellOutWord(target.word)
  }, [pickPracticeWord, spellOutWord])

  const completePronounceRound = useCallback(
    async (markMastered: boolean) => {
      if (!pronounceTarget) {
        setPronounceFeedback({ type: "info", message: "Start a mission first." })
        return
      }

      const ok = await logWordActivity(pronounceTarget.word, markMastered ? "pronounce_mastered" : "pronounce_practice", {
        markMastered,
        payload: { letters: pronounceTarget.word.length },
      })

      if (ok) {
        setPronounceFeedback({
          type: "success",
          message: markMastered
            ? `${pronounceTarget.word} is locked in. Strong voice!`
            : `Nice effort! Keep practicing ${pronounceTarget.word}.`,
        })
        setPronounceTarget(null)
        setPronounceRevealed(false)
      } else {
        setPronounceFeedback({ type: "error", message: "Couldn't save that attempt. Try again in a moment." })
      }
    },
    [logWordActivity, pronounceTarget],
  )

  const renderFeedback = (feedback: PracticeFeedback | null) => {
    if (!feedback) {
      return null
    }

    const tone =
      feedback.type === "success" ? "text-emerald-600" : feedback.type === "error" ? "text-red-600" : "text-muted-foreground"

    return <p className={`text-sm font-medium ${tone}`}>{feedback.message}</p>
  }

  if (words.length === 0) {
    return (
      <Card className="mt-8 border-2 border-dashed border-primary/20 bg-white">
        <CardHeader>
          <CardTitle>Practice Missions</CardTitle>
          <CardDescription>Tap “Hear It” while learning words to unlock Moe's word games.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once you have words in your bank, Moe will let you spell, identify, and pronounce them here for extra streak points.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-8 border-2 border-primary/20 bg-white">
      <CardHeader>
        <CardTitle>Practice Missions</CardTitle>
        <CardDescription>Three quick challenges to keep every new word fresh.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activePracticeTab} onValueChange={(value) => setActivePracticeTab(value as typeof activePracticeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="spell">Spell It Out</TabsTrigger>
            <TabsTrigger value="identify">Pick The Word</TabsTrigger>
            <TabsTrigger value="pronounce">Say It Loud</TabsTrigger>
          </TabsList>

          <TabsContent value="spell" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Moe says a word without showing it. Type or say the spelling and lock it in to earn a mastery badge.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={startSpellChallenge} disabled={isLogging}>
                Start a word
              </Button>
              <Button
                variant="secondary"
                onClick={() => spellTarget && speakWord(spellTarget.word)}
                disabled={!spellTarget}
              >
                Hear it again
              </Button>
              <Button
                variant={isSpellListening ? "destructive" : "outline"}
                onClick={() => (isSpellListening ? stopSpellListening() : startSpellListening())}
                disabled={!spellTarget}
              >
                {isSpellListening ? "Stop Mic" : "🎤 Spell by Voice"}
              </Button>
            </div>
            {spellTarget ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Letters: <span className="font-semibold">{spellTarget.word.length}</span>
                </p>
                <Input
                  value={spellInput}
                  onChange={(event) => setSpellInput(event.target.value)}
                  placeholder="Type or say the word here"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      void submitSpelling()
                    }
                  }}
                />
                <Button onClick={() => void submitSpelling()} disabled={isLogging || spellInput.trim().length === 0}>
                  Check spelling
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Press “Start a word” to begin a spelling challenge.</p>
            )}
            {renderFeedback(spellFeedback)}
          </TabsContent>

          <TabsContent value="identify" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Moe shows a few words and calls one out. Tap the word you hear to score points.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={startIdentifyRound} disabled={isLogging}>
                New round
              </Button>
              <Button
                variant="secondary"
                onClick={() => identifyTarget && speakWord(identifyTarget)}
                disabled={!identifyTarget}
              >
                Hear the word
              </Button>
            </div>
            {identifyOptions.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {identifyOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => void pickIdentifyOption(option)}
                    className="rounded-lg border-2 border-primary/20 px-4 py-3 text-left font-semibold capitalize transition hover:border-primary/60 hover:bg-primary/10"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Start a round to see your word options.</p>
            )}
            {renderFeedback(identifyFeedback)}
          </TabsContent>

          <TabsContent value="pronounce" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Moe spells a word letter by letter. Say it out loud, use the mic, and Moe will check if you got it!
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={startPronounceRound} disabled={isLogging}>
                Start mission
              </Button>
              <Button
                variant="secondary"
                onClick={() => pronounceTarget && spellOutWord(pronounceTarget.word)}
                disabled={!pronounceTarget}
              >
                Hear spelling again
              </Button>
              <Button
                variant={isPronounceListening ? "destructive" : "outline"}
                onClick={() => (isPronounceListening ? stopPronounceListening() : startPronounceListening())}
                disabled={!pronounceTarget}
              >
                {isPronounceListening ? "Stop Mic" : "🎤 Say with Mic"}
              </Button>
              {pronounceTarget && !pronounceRevealed ? (
                <Button variant="ghost" onClick={() => setPronounceRevealed(true)}>
                  Reveal word
                </Button>
              ) : null}
            </div>
            {pronounceTarget ? (
              <div className="space-y-3 rounded-lg border border-primary/10 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  Letters: <span className="font-semibold">{pronounceTarget.word.length}</span>
                </p>
                {pronounceRevealed ? (
                  <p className="text-xl font-bold capitalize text-primary">{pronounceTarget.word}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Say the word aloud before revealing it.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void completePronounceRound(true)}
                    disabled={isLogging}
                  >
                    I nailed it (mark mastered)
                  </Button>
                  <Button onClick={() => void completePronounceRound(false)} disabled={isLogging}>
                    I said it!
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Press “Start mission” to hear a word spelled out.</p>
            )}
            {renderFeedback(pronounceFeedback)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function WordGrid({ words, emptyMessage }: { words: WordEntry[]; emptyMessage: string }) {
  if (words.length === 0) {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-white">
        <CardContent className="py-10 text-center text-muted-foreground">{emptyMessage}</CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {words.map((word) => (
        <Card key={word.word} className="border-2 border-primary/10 bg-white transition hover:-translate-y-1 hover:shadow-lg">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="capitalize">{word.word}</CardTitle>
            <Badge variant={word.mastered ? "default" : "secondary"} className={word.mastered ? "bg-emerald-500" : "bg-amber-200 text-amber-800"}>
              {word.mastered ? "Mastered" : "Practice"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {word.definition || word.example_sentence ? (
              <p className="text-sm text-muted-foreground">
                {(word.definition || word.example_sentence || "").slice(0, 140)}
                {(word.definition || word.example_sentence || "").length > 140 ? "…" : ""}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No definition saved yet. Learn the word to fill this in.</p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatReviewCount(word.times_reviewed)}
              </span>
              <span>{formatRelativeTime(word.last_reviewed_at)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatReviewCount(count: number | null) {
  if (!count || count <= 1) return "1 review"
  return `${count} reviews`
}

function formatRelativeTime(timestamp: string | null) {
  if (!timestamp) return "not yet"

  const date = new Date(timestamp)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return "just now"
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

function formatStatus(status: string) {
  if (status === "pronounced") return "Heard with Moe"
  if (status === "lookup") return "Looked up"
  if (status === "mastered") return "Mastered"
  if (status === "needs_review") return "Marked for review"
  if (status === "spell_mastered") return "Spelling challenge"
  if (status === "identify_correct") return "Word ID win"
  if (status === "pronounce_practice") return "Pronunciation practice"
  if (status === "pronounce_mastered") return "Pronunciation mastered"
  return status
}
