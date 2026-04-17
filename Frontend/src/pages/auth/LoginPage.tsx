import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

export function LoginPage(){

    const[username, setUsername] = useState("")
    const[password, setPassword] = useState("")
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

    const handleLogin = async(e: React.FormEvent) =>{
        e.preventDefault();
        
        // Clear any existing error timeout
        if (errorTimeout) clearTimeout(errorTimeout);
        
        setSubmitting(true)
        setError("")
        try{
            const res = await api.post("/token/", {username, password});
            localStorage.setItem("access", res.data.access);
            localStorage.setItem("refresh", res.data.refresh);
            navigate("/dashboard")
        }catch (err: any){
            console.error(err)
            // Extract specific error message from API response
            const detail = err.response?.data?.detail;
            const message = err.response?.data?.message;
            
            let errorMsg = "";
            if (err.response?.status === 429) {
              // Rate limit error - the global notification will show this
              errorMsg = "Too many login attempts. Please wait before trying again."
            } else if (detail || message) {
              errorMsg = detail || message
            } else if (err.response?.status === 401) {
              errorMsg = "Invalid username or password."
            } else {
              errorMsg = "Login failed. Please check your username and password."
            }
            
            setError(errorMsg);
            
            // Keep error visible for 12 seconds (longer than auto-dismiss to be safe)
            const timeout = setTimeout(() => {
              setError("");
            }, 12000);
            setErrorTimeout(timeout);
        } finally {
            setSubmitting(false)
        }
    }

    return(
    <div className="app-shell flex items-center justify-center">
      <div className="glass-card w-full max-w-md p-8">
        <p className="text-sm font-semibold text-teal-700 mb-3">Mangrove Guardian AI</p>
        <h1 className="page-title text-4xl mb-2">Welcome Back</h1>
        <p className="subtle-text text-sm mb-6">Sign in to view reports, map activity, and AI analysis insights.</p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
            <p className="mt-4 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <a href="/register" className="font-semibold text-teal-600 hover:text-teal-700">Sign up</a>
            </p>
      </div>
    </div>
    );
}