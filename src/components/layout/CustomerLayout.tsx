import { Outlet } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import Footer from './Footer';
export default function CustomerLayout() {
  return (<div className="flex min-h-screen flex-col bg-background"><CustomerNavbar /><main className="flex-1"><Outlet /></main><Footer /></div>);
}
