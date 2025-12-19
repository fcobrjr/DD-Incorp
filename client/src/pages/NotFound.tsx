import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">Página não encontrada</p>
        <Link href="/">
          <a className="text-primary hover:underline">Voltar ao início</a>
        </Link>
      </div>
    </div>
  );
}
