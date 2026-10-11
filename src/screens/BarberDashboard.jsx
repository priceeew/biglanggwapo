import { go } from "../router.js";
import { useUser } from "../auth.js";
import LogoutButton from "../LogoutButton.jsx";


export const size = { width: 1440, height: 1525 };

export default function BarberDashboard({ title = "BARBER DASHBOARD" }) {
  const user = useUser();
  return (
    <div data-name="Barber — Dashboard" style={{"position":"absolute","left":0,"top":0,"width":1440,"height":1525,"backgroundColor":"#DCE1E4","overflow":"hidden"}}>
      <div data-name="Workspace navigation" style={{"position":"absolute","left":0,"top":0,"width":248,"height":1525,"backgroundColor":"#1F313E","overflow":"hidden"}}>
        <div data-name="Brand" style={{"position":"absolute","left":20,"top":32,"width":203,"height":46}}>
          <img data-name="Brand logo" alt="Biglang Guapo" src="/logo.png" style={{"position":"absolute","left":0,"top":-12,"width":56,"height":62,"objectFit":"contain"}} />
          <div data-name="Wordmark" style={{"position":"absolute","left":64,"top":0,"width":159,"height":46}}>
            <div data-name="Name" style={{"position":"absolute","left":0,"top":0,"width":159,"height":33,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":22,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"BIGLANG GUAPO"}</div>
            <div data-name="Descriptor" style={{"position":"absolute","left":0,"top":36,"width":104,"height":10,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":8,"lineHeight":1.0,"letterSpacing":2,"color":"#B8BFC5","textAlign":"left","whiteSpace":"pre"}}>{"BARBERSHOP · EST. 2024"}</div>
          </div>
        </div>
        <div data-name="Role" style={{"position":"absolute","left":20,"top":110,"width":208,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"letterSpacing":1.6,"color":"#B8BFC5","textAlign":"left","whiteSpace":"pre-wrap"}}>{"BARBER / WORKSPACE"}</div>
        <div data-name="Modules" style={{"position":"absolute","left":20,"top":154,"width":208,"height":270,"overflow":"hidden"}}>
          <div data-name="Active module" className="nav" role="link" onClick={() => go("/barber/dashboard")} style={{"position":"absolute","left":0,"top":0,"width":208,"height":46,"backgroundColor":"#F3E300","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":14,"top":14,"width":180,"height":18,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.5,"color":"#1F313E","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Dashboard ↗"}</div>
          </div>
          <div data-name="Module link" className="nav" role="link" onClick={() => go("/barber/my-appointments")} style={{"position":"absolute","left":0,"top":52,"width":208,"height":50,"cursor":"pointer","fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.5,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre-wrap","display":"flex","flexDirection":"column","justifyContent":"center"}}><div style={{"width":"100%"}}>{"My Appointments"}</div></div>
          <div data-name="Module link" className="nav" role="link" onClick={() => go("/barber/queue-customer-management")} style={{"position":"absolute","left":0,"top":108,"width":208,"height":50,"cursor":"pointer","fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.5,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre-wrap","display":"flex","flexDirection":"column","justifyContent":"center"}}><div style={{"width":"100%"}}>{"Queue & Customer Management"}</div></div>
          <div data-name="Module link" className="nav" role="link" onClick={() => go("/barber/service-management")} style={{"position":"absolute","left":0,"top":164,"width":208,"height":50,"cursor":"pointer","fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.5,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre-wrap","display":"flex","flexDirection":"column","justifyContent":"center"}}><div style={{"width":"100%"}}>{"Service Management"}</div></div>
          <div data-name="Module link" className="nav" role="link" onClick={() => go("/barber/schedule")} style={{"position":"absolute","left":0,"top":220,"width":208,"height":50,"cursor":"pointer","fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.5,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre-wrap","display":"flex","flexDirection":"column","justifyContent":"center"}}><div style={{"width":"100%"}}>{"Schedule"}</div></div>
        </div>
        <div data-name="Workspace note" style={{"position":"absolute","left":20,"top":456,"width":208,"height":143,"overflow":"hidden"}}>
          <div data-name="Shop" style={{"position":"absolute","left":0,"top":28,"width":159,"height":36,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":24,"lineHeight":1.0,"color":"#B8BFC5","textAlign":"left","whiteSpace":"pre"}}>{"CRAFT OVER HYPE."}</div>
          <div data-name="Sample notice" style={{"position":"absolute","left":0,"top":78,"width":208,"height":36,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.600000023841858,"color":"#B8BFC5","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Sample shop · Demo workspace\nAll records are illustrative."}</div>
          <div data-name="Public website" className="nav" role="link" onClick={() => go("/")} style={{"position":"absolute","left":0,"top":128,"width":147,"height":15,"cursor":"pointer","fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"View customer website ↗"}</div>
        </div>
      </div>
      <div data-name="Page" style={{"position":"absolute","left":248,"top":0,"width":1192,"height":1525,"overflow":"hidden"}}>
        <div data-name="Workspace toolbar" style={{"position":"absolute","left":0,"top":0,"width":1192,"height":76,"backgroundColor":"#F3F5F6","borderBottom":"1px solid #B8BFC5","overflow":"hidden"}}>
          <div data-name="Breadcrumb" style={{"position":"absolute","left":40,"top":30.5,"width":218,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre"}}>{"Biglang Guapo / Barber / Dashboard"}</div>
          <div data-name="Session" style={{"position":"absolute","left":687,"top":27,"width":465,"height":22,"overflow":"hidden"}}>
            <div data-name="Status" style={{"position":"absolute","left":0,"top":0,"width":71,"height":22,"backgroundColor":"#DCE1E4","borderRadius":3,"overflow":"hidden"}}>
              <div data-name="Label" style={{"position":"absolute","left":9,"top":5,"width":53,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":10,"lineHeight":1.0,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"Demo data"}</div>
            </div>
            <div data-name="Clock" style={{"position":"absolute","left":95,"top":4.5,"width":150,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre"}}>{"TUE 06 OCT 2026 · 11:15 AM"}</div>
            <div data-name="Identity" style={{"position":"absolute","left":269,"top":3.5,"width":96,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Marcus Reed"}</div>
            <LogoutButton variant="dark" style={{ left: 375, top: 0, width: 90, height: 22 }} />
          </div>
        </div>
        <div data-name="Main content" style={{"position":"absolute","left":0,"top":76,"width":1192,"height":1449,"overflow":"hidden"}}>
          <div style={{"position":"absolute","left":40,"top":40,"width":1112.0,"height":640,"border":"2px dashed #6C8493","background":"rgba(255,255,255,.4)","padding":32,"fontFamily":"ui-monospace,Consolas,monospace","fontSize":14,"lineHeight":1.8,"color":"#2C4C5B"}}>
            <div>[BACKEND SYSTEM - {title.toUpperCase()}]</div>
            <div>AHSEEEEEEEEEERRRRRRRRRRRR</div>
          </div>
        </div>
      </div>
    </div>
  );
}
