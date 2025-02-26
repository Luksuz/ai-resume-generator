"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Wand2, Plus, Trash2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"

type Interests = {
  interest: string
  description: string
}

type WorkExperience = {
  company: string
  position: string
  start_date: string
  end_date: string
  description: string
}

type Education = {
  school: string
  degree: string
  field_of_study: string
  graduation_year: number
}

type StructuredUserInfo = {
  name: string
  age: number
  location: string
  email: string
  phone: string
  links: string[]
  interests: Interests[]
  work_experience: WorkExperience[]
  education: Education[]
  resume_style_notes: string
  custom_input?: string
}

export default function CreateResume() {
  const [content, setContent] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [userInfo, setUserInfo] = useState<StructuredUserInfo>({
    name: "",
    age: 0,
    location: "",
    email: "",
    phone: "",
    links: [],
    interests: [],
    work_experience: [],
    education: [],
    resume_style_notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    
    try {
      // Send content to backend to generate resume
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, customInput: userInfo.custom_input }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to generate resume")
      }
      console.log(response);
      
      // Get the PDF as a blob directly from the response
      const pdfBlob = await response.blob()
      setPdfBlob(pdfBlob)
    } catch (error) {
      console.error("Error generating resume:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      // Make API call to analyze content
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, customInput: userInfo.custom_input }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to analyze content")
      }
      
      // Get the PDF as a blob directly from the response
      const pdfBlob = await response.blob()
      setPdfBlob(pdfBlob)
    } catch (error) {
      console.error("Error analyzing content:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const updateUserInfo = (field: keyof StructuredUserInfo, value: any) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }))
  }

  const addListItem = (field: "links" | "interests" | "work_experience" | "education") => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: [...prev[field], field === "links" ? "" : {}],
    }))
  }

  const updateListItem = (
    field: "links" | "interests" | "work_experience" | "education",
    index: number,
    value: any,
  ) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
  }

  const removeListItem = (field: "links" | "interests" | "work_experience" | "education", index: number) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/dashboard">
          <span className="font-bold text-2xl text-primary">AI Resume</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/dashboard">
            Dashboard
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/">
            Log Out
          </Link>
        </nav>
      </header>
      <main className="flex-1 py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Create Your Resume</h1>
            <p className="mb-8 text-gray-600 text-center">
              Let's craft an amazing resume together! Simply paste your content, and our AI will do the rest.
            </p>

            <div className="mb-8 p-6 bg-secondary/20 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Content Analyzer</h2>
              <p className="text-sm text-gray-600 mb-4">
                Instructions: Copy and paste the entire content of the webpage that contains your professional
                information. This could be your LinkedIn profile, personal website, or any other page that summarizes
                your experience and skills.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">Paste Your Content Here</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste the entire content of your professional webpage here..."
                    rows={10}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="custom_input">Additional Information</Label>
                  <Textarea
                    id="custom_input"
                    value={userInfo.custom_input || ""}
                    onChange={(e) => updateUserInfo("custom_input", e.target.value)}
                    placeholder="Any additional information you'd like to include in your resume..."
                    rows={5}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Analyze Content
                    </>
                  )}
                </Button>
              </div>
            </div>

            {userInfo.name && (
              <Accordion type="single" collapsible className="w-full mb-8">
                <AccordionItem value="user-info">
                  <AccordionTrigger>Extracted Information (Click to Edit)</AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                value={userInfo.name}
                                onChange={(e) => updateUserInfo("name", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="age">Age</Label>
                              <Input
                                id="age"
                                type="number"
                                value={userInfo.age}
                                onChange={(e) => updateUserInfo("age", Number.parseInt(e.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={userInfo.location}
                              onChange={(e) => updateUserInfo("location", e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={userInfo.email}
                                onChange={(e) => updateUserInfo("email", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone</Label>
                              <Input
                                id="phone"
                                value={userInfo.phone}
                                onChange={(e) => updateUserInfo("phone", e.target.value)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Links</Label>
                            {userInfo.links.map((link, index) => (
                              <div key={index} className="flex items-center mt-2">
                                <Input value={link} onChange={(e) => updateListItem("links", index, e.target.value)} />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeListItem("links", index)}
                                  className="ml-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addListItem("links")} className="mt-2">
                              <Plus className="h-4 w-4 mr-2" /> Add Link
                            </Button>
                          </div>
                          <div>
                            <Label>Interests</Label>
                            {userInfo.interests.map((interest, index) => (
                              <div key={index} className="space-y-2 mt-2">
                                <Input
                                  value={interest.interest}
                                  onChange={(e) =>
                                    updateListItem("interests", index, { ...interest, interest: e.target.value })
                                  }
                                  placeholder="Interest"
                                />
                                <Textarea
                                  value={interest.description}
                                  onChange={(e) =>
                                    updateListItem("interests", index, { ...interest, description: e.target.value })
                                  }
                                  placeholder="Description"
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeListItem("interests", index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addListItem("interests")}
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" /> Add Interest
                            </Button>
                          </div>
                          <div>
                            <Label>Work Experience</Label>
                            {userInfo.work_experience.map((exp, index) => (
                              <div key={index} className="space-y-2 mt-2 p-4 border rounded">
                                <Input
                                  value={exp.company}
                                  onChange={(e) =>
                                    updateListItem("work_experience", index, { ...exp, company: e.target.value })
                                  }
                                  placeholder="Company"
                                />
                                <Input
                                  value={exp.position}
                                  onChange={(e) =>
                                    updateListItem("work_experience", index, { ...exp, position: e.target.value })
                                  }
                                  placeholder="Position"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    value={exp.start_date}
                                    onChange={(e) =>
                                      updateListItem("work_experience", index, { ...exp, start_date: e.target.value })
                                    }
                                    placeholder="Start Date"
                                  />
                                  <Input
                                    value={exp.end_date}
                                    onChange={(e) =>
                                      updateListItem("work_experience", index, { ...exp, end_date: e.target.value })
                                    }
                                    placeholder="End Date"
                                  />
                                </div>
                                <Textarea
                                  value={exp.description}
                                  onChange={(e) =>
                                    updateListItem("work_experience", index, { ...exp, description: e.target.value })
                                  }
                                  placeholder="Description"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeListItem("work_experience", index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addListItem("work_experience")}
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" /> Add Work Experience
                            </Button>
                          </div>
                          <div>
                            <Label>Education</Label>
                            {userInfo.education.map((edu, index) => (
                              <div key={index} className="space-y-2 mt-2 p-4 border rounded">
                                <Input
                                  value={edu.school}
                                  onChange={(e) =>
                                    updateListItem("education", index, { ...edu, school: e.target.value })
                                  }
                                  placeholder="School"
                                />
                                <Input
                                  value={edu.degree}
                                  onChange={(e) =>
                                    updateListItem("education", index, { ...edu, degree: e.target.value })
                                  }
                                  placeholder="Degree"
                                />
                                <Input
                                  value={edu.field_of_study}
                                  onChange={(e) =>
                                    updateListItem("education", index, { ...edu, field_of_study: e.target.value })
                                  }
                                  placeholder="Field of Study"
                                />
                                <Input
                                  type="number"
                                  value={edu.graduation_year}
                                  onChange={(e) =>
                                    updateListItem("education", index, {
                                      ...edu,
                                      graduation_year: Number.parseInt(e.target.value),
                                    })
                                  }
                                  placeholder="Graduation Year"
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeListItem("education", index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addListItem("education")}
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" /> Add Education
                            </Button>
                          </div>
                          <div>
                            <Label htmlFor="resume_style_notes">Resume Style Notes</Label>
                            <Textarea
                              id="resume_style_notes"
                              value={userInfo.resume_style_notes}
                              onChange={(e) => updateUserInfo("resume_style_notes", e.target.value)}
                              placeholder="Any specific style preferences for your resume?"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Resume...
                  </>
                ) : (
                  "Generate Resume"
                )}
              </Button>
            </form>
            
            {pdfBlob && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Your Generated Resume</h2>
                <div className="border rounded-lg overflow-hidden">
                  <iframe 
                    src={URL.createObjectURL(pdfBlob)} 
                    className="w-full h-[600px]" 
                    title="Generated Resume"
                  />
                </div>
                <div className="mt-4 flex justify-center">
                  <Button asChild>
                    <a 
                      href={URL.createObjectURL(pdfBlob)} 
                      download="resume.pdf"
                    >
                      Download Resume
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

