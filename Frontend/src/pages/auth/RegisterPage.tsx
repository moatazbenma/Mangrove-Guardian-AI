import React, { useState, useEffect } from "react";
import { register } from "../../services/auth";
import { useNavigate } from "react-router-dom";




export function RegisterPage(){
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null)


    const navigate = useNavigate()

    // Clear error timeout on cleanup
    useEffect(() => {
      return () => {
        if (errorTimeout) clearTimeout(errorTimeout);
      };
    }, [errorTimeout]);


    const handleregister = async(e:React.FormEvent) =>{
        e.preventDefault()
        
        // Clear any existing error timeout
        if (errorTimeout) clearTimeout(errorTimeout);
        
        setSubmitting(true)
        setError("")
        try{
            await register({ username, email, password, role })
            navigate("/login")
        }catch (err: any){
            console.error(err)
            // Extract specific error message from API response
            const detail = err.response?.data?.detail;
            const message = err.response?.data?.message;
            const errors = err.response?.data;
            
            let errorMsg = "";
            if (err.response?.status === 429) {
              // Rate limit error
              errorMsg = "Too many registration attempts. Please wait before trying again."
            } else if (detail || message) {
              errorMsg = detail || message
            } else if (errors?.username) {
              errorMsg = `Username: ${Array.isArray(errors.username) ? errors.username[0] : errors.username}`
            } else if (errors?.email) {
              errorMsg = `Email: ${Array.isArray(errors.email) ? errors.email[0] : errors.email}`
            } else if (errors?.password) {
              errorMsg = `Password: ${Array.isArray(errors.password) ? errors.password[0] : errors.password}`
            } else {
              errorMsg = "Registration failed. Please check your information and try again."
            }
            
            setError(errorMsg);
            
            // Keep error visible for 12 seconds
            const timeout = setTimeout(() => {
              setError("");
            }, 12000);
            setErrorTimeout(timeout);
        }finally{
            setSubmitting(false)
        }
    }



    return (
        <div className="app-shell flex items-center justify-center">
          <div className="glass-card w-full max-w-md p-8">
            <p className="text-sm font-semibold text-teal-700 mb-3">Mangrove Guardian AI</p>
            <h1 className="page-title text-4xl mb-2">Create Account</h1>
            <p className="subtle-text text-sm mb-6">Join the Mangrove Guardian community to submit reports and track restoration efforts.</p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleregister} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 outline-none transition focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 outline-none transition focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 outline-none transition focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 outline-none transition focus:border-teal-500"
                  required
                >
                  <option value="">Select a role</option>
                  <option value="community">Community</option>
                  <option value="organization">Organization</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-teal-600 hover:text-teal-700">Sign in</a>
            </p>
          </div>
        </div>
    );


}