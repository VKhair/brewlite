import type {Metadata} from 'next';
import {StoreProvider} from '../lib/store';
import {Header,Footer} from '../components/ui';
import './globals.css';
export const metadata:Metadata={title:'BrewLite | Đặt nước thật dễ',description:'BrewLite – đặt cà phê, trà và thức uống yêu thích, thanh toán không tiền mặt và nhận tại quầy.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><StoreProvider><Header/><main className="main-content">{children}</main><Footer/></StoreProvider></body></html>}
