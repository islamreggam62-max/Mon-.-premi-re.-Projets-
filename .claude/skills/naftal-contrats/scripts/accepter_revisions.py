"""Accepte toutes les révisions d'un document Word via LibreOffice (UNO) et l'enregistre en .docx."""
import subprocess
import sys
import time

import uno
from com.sun.star.beans import PropertyValue

src, dst = sys.argv[1], sys.argv[2]
proc = subprocess.Popen(["soffice", "--headless", "--invisible", "--norestore",
                         "--accept=socket,host=localhost,port=2002;urp;"])
ctx = None
for _ in range(60):
    try:
        local = uno.getComponentContext()
        resolver = local.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", local)
        ctx = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
        break
    except Exception:
        time.sleep(1)
smgr = ctx.ServiceManager
desktop = smgr.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)


def pv(n, v):
    p = PropertyValue()
    p.Name, p.Value = n, v
    return p


doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(src), "_blank", 0, (pv("Hidden", True),))
disp = smgr.createInstanceWithContext("com.sun.star.frame.DispatchHelper", ctx)
disp.executeDispatch(doc.getCurrentController().getFrame(), ".uno:AcceptAllTrackedChanges", "", 0, ())
doc.setPropertyValue("RecordChanges", False)
doc.storeToURL(uno.systemPathToFileUrl(dst), (pv("FilterName", "MS Word 2007 XML"),))
doc.close(True)
try:
    desktop.terminate()
except Exception:
    pass
proc.wait(timeout=30)
print("ok", dst)
