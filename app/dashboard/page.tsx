import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  // Mock data for resumes
  const resumes = [
    { id: 1, title: "Software Developer Resume", lastUpdated: "2023-06-15" },
    { id: 2, title: "Product Manager Resume", lastUpdated: "2023-06-10" },
    { id: 3, title: "Data Analyst Resume", lastUpdated: "2023-06-05" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="/dashboard">
          <span className="font-bold text-2xl">AI Resume</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/settings">
            Settings
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/">
            Log Out
          </Link>
        </nav>
      </header>
      <main className="flex-1 py-12 px-4 md:px-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Resumes</h1>
          <div className="mb-6">
            <Button asChild>
              <Link href="/create-resume">Create New Resume</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <div key={resume.id} className="border p-4 rounded-lg">
                <h2 className="font-semibold mb-2">{resume.title}</h2>
                <p className="text-sm text-gray-500 mb-4">Last updated: {resume.lastUpdated}</p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/edit-resume/${resume.id}`}>Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

