import React from 'react'

function Footer() {
  return (
    <footer className="bg-slate-950 text-white flex items-center justify-center py-4 h-[55px]">
      <p className="text-sm md:text-base font-medium">
        &copy; {new Date().getFullYear()} All rights reserved by Raj
      </p>
    </footer>
  )
}

export default Footer
