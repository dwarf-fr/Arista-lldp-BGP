# LLDP MAP

The LLDP MAP software is drawing a layer 2 MAP based on LLDP information. The soft is working only with Arista devices and with CVX. At the end we should be able to propose more graphical information.
The application is using two languages : Python for the scripting part and Javascript for the GUI.
The code is not optimized because the purpose is to share the information and I tried to write the code in a very simple way.

## Installation
You need a python environment (vers 2.7) with the following packages
* flask - pip install flask
* jsonrpclib - pip install jsonrpclib
* netaddr - pip install netaddr

Unzip the package.

## Getting Started

Once the package has been installed, you can run the application to verify that everything has been installed properly.

Go to the directory : ```
python maplldp.py ```
You should see on your console the following information ```
dwarf@pythondev:~/Dev/MapLLDP$ python maplldp.py 
 Running on http://0.0.0.0:3000/ (Press CTRL+C to quit)
 Restarting with stat
 Debugger is active!
 Debugger pin code: 103-440-178 ```

Open your favorite web browser and don't forget to insert the port (3000). In my case : ```
http:\\pythondev:3000 ```

The last point is, you have to enter the CVX credential. For this you have to open the maplldp.py file ```
vi maplldp.py ```
Replace the following lines by your information : ```
userId = 'dwarf' password = 'arista' cvxServer = '192.168.10.10' ```

## Functions
* You can organize your map and save it.
* You can remove all management link.
* If you click on a link you should see the interface information (eth xx). Click again and the information disappears.
* Also you have a zoom function.

Have fun !!