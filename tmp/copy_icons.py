import shutil
import os

src_512 = r'C:\Users\Marco Dev\.gemini\antigravity\brain\64e1ca4f-91c3-4eb4-b053-54eab16e1d28\ran_icon_premium_square_1774998776019.png'
src_192 = r'C:\Users\Marco Dev\.gemini\antigravity\brain\64e1ca4f-91c3-4eb4-b053-54eab16e1d28\ran_icon_192_square_1774998796421.png'

dest_512 = r'c:\Users\Marco Dev\Desktop\Marco Dev\Proyectos\RAN\ran-app\public\icon-512.png'
dest_192 = r'c:\Users\Marco Dev\Desktop\Marco Dev\Proyectos\RAN\ran-app\public\icon-192.png'
dest_favicon = r'c:\Users\Marco Dev\Desktop\Marco Dev\Proyectos\RAN\ran-app\public\favicon.png'

shutil.copy(src_512, dest_512)
shutil.copy(src_192, dest_192)
shutil.copy(src_192, dest_favicon) # Use 192 for favicon.png too, browser will scale

print("Files copied successfully")
