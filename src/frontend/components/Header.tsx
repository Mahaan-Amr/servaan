import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-ivory dark:bg-dark-brown shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-chili-red">
            سِروان
          </Link>
        </div>
        
        <nav>
          <ul className="flex space-x-6 space-x-reverse">
            <li>
              <Link href="/workspaces/inventory-management" className="hover:text-chili-red">
                مدیریت موجودی
              </Link>
            </li>
            <li>
              <Link href="/workspaces/business-intelligence" className="hover:text-chili-red">
                هوش تجاری
              </Link>
            </li>
            <li>
              <Link href="/workspaces/accounting-system" className="hover:text-chili-red">
                حسابداری
              </Link>
            </li>
          </ul>
        </nav>
        
        <div>
          <Link 
            href="/login" 
            className="bg-chili-red text-white py-2 px-4 rounded hover:bg-chili-red-dark"
          >
            ورود
          </Link>
        </div>
      </div>
    </header>
  );
} 