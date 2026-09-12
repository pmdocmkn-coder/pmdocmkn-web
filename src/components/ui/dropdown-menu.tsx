import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined)

const useDropdownMenu = () => {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenu components must be used within DropdownMenu')
  }
  return context
}

interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DropdownMenu = ({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, onOpenChange]
  )

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild = false, onClick, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdownMenu()

  const setTriggerRef = React.useCallback((node: HTMLButtonElement | null) => {
    triggerRef.current = node
    if (typeof ref === "function") {
      ref(node)
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }
  }, [ref, triggerRef])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setOpen(!open)
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: setTriggerRef,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        setOpen(!open)
        ;(children as any).props?.onClick?.(e)
      },
    })
  }

  return (
    <button
      ref={setTriggerRef}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'start' | 'center' | 'end'
  }
>(({ className, children, align = 'end', ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdownMenu()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null)

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const contentEl = contentRef.current
    const menuWidth = contentEl?.offsetWidth || 160
    const menuHeight = contentEl?.offsetHeight || 160

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // Check if bottom overflow -> flip to top
    const spaceBelow = windowHeight - rect.bottom
    const spaceAbove = rect.top
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow

    const top = openUp 
      ? Math.max(8, rect.top - menuHeight - 4)
      : Math.min(windowHeight - menuHeight - 8, rect.bottom + 4)

    let left: number
    if (align === 'start') {
      left = rect.left
    } else if (align === 'center') {
      left = rect.left + rect.width / 2 - menuWidth / 2
    } else {
      left = rect.right - menuWidth
    }

    if (left + menuWidth > windowWidth - 8) {
      left = windowWidth - menuWidth - 8
    }
    if (left < 8) {
      left = 8
    }

    setCoords({ top, left })
  }, [triggerRef, align])

  React.useLayoutEffect(() => {
    if (open) {
      updatePosition()
    }
  }, [open, updatePosition])

  React.useEffect(() => {
    if (!open) return

    const handleScrollOrResize = () => {
      updatePosition()
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        contentRef.current && 
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen, triggerRef, updatePosition])

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

  if (!open) return null

  const content = (
    <div
      ref={contentRef}
      style={{
        position: 'fixed',
        top: coords ? `${coords.top}px` : '-9999px',
        left: coords ? `${coords.left}px` : '-9999px',
        zIndex: 9999,
      }}
      className={cn(
        "min-w-[8rem] rounded-md border border-gray-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { setOpen } = useDropdownMenu()
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100",
        className
      )}
      onClick={(e) => {
        setOpen(false)
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-gray-100", className)}
      {...props}
    />
  )
})
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
}