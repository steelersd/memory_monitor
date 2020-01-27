from glob import glob
import setuptools

setuptools.setup(
    name="memory_monitor",
    packages=['memory_monitor'],
    version='0.1.0',
    license='MIT',
    description="Simple Jupyter extension to show how much resources (RAM) your notebook is using",
    url="https://github.com/steelersd/memory_monitor",
    download_url="https://github.com/steelersd/memory_monitor/archive/0.1.0.tar.gz",
    keywords=['Jupyter', 'Notebook', 'Extension'],
    # install_requires=[
    #     'psutil',
    #     'notebook',
    # ],
    include_package_data=True,
    data_files=[
        # like `jupyter nbextension install --sys-prefix`
        ('share/jupyter/nbextensions/memory_monitor',
         glob('memory_monitor/static/*')),
        # like `jupyter nbextension enable --sys-prefix`
        ('etc/jupyter/nbconfig/notebook.d',
         ['memory_monitor/etc/nbextension.json']),
        # like `jupyter serverextension enable --sys-prefix`
        ('etc/jupyter/jupyter_notebook_config.d',
         ['memory_monitor/etc/serverextension.json']),
    ],
    python_requires='>=3.6'

)
